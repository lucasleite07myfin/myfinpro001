import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface BiometricCredential {
  id: string;
  rawId: ArrayBuffer;
  type: string;
}

export const useBiometric = () => {
  const [isAvailable, setIsAvailable] = useState(false);
  const [isRegistered, setIsRegistered] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAvailability();
  }, []);

  const checkAvailability = async () => {
    try {
      // Verifica se o navegador suporta WebAuthn
      const available = window.PublicKeyCredential !== undefined &&
        typeof window.PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable === 'function';
      
      if (available) {
        const platformAuthAvailable = await window.PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
        setIsAvailable(platformAuthAvailable);
      }

      // Verifica se usuário já registrou biometria
      const storedCredential = localStorage.getItem('biometric_credential_id');
      setIsRegistered(!!storedCredential);
    } catch (error) {
      console.error('Erro ao verificar disponibilidade de biometria:', error);
      setIsAvailable(false);
    } finally {
      setLoading(false);
    }
  };

  const registerBiometric = async (userId: string, email: string) => {
    try {
      // Prepara desafio para registro
      const challenge = new Uint8Array(32);
      crypto.getRandomValues(challenge);

      const publicKeyCredentialCreationOptions: PublicKeyCredentialCreationOptions = {
        challenge,
        rp: {
          name: "MyFin",
          id: window.location.hostname,
        },
        user: {
          id: new TextEncoder().encode(userId),
          name: email,
          displayName: email.split('@')[0],
        },
        pubKeyCredParams: [
          { alg: -7, type: "public-key" },  // ES256
          { alg: -257, type: "public-key" }, // RS256
        ],
        authenticatorSelection: {
          authenticatorAttachment: "platform", // Face ID / Touch ID
          requireResidentKey: false,
          userVerification: "required",
        },
        timeout: 60000,
        attestation: "none",
      };

      const credential = await navigator.credentials.create({
        publicKey: publicKeyCredentialCreationOptions,
      }) as PublicKeyCredential;

      if (credential) {
        // Converter credential ID para base64
        const credentialIdBase64 = btoa(
          String.fromCharCode(...new Uint8Array(credential.rawId))
        );

        // Converter public key para base64
        const response = credential.response as AuthenticatorAttestationResponse;
        const publicKeyBase64 = btoa(
          String.fromCharCode(...new Uint8Array(response.getPublicKey()!))
        );

        console.log('Registering biometric credential with backend...');

        // Enviar para backend via Edge Function
        const { error: registerError } = await supabase.functions.invoke('register-biometric', {
          body: {
            user_id: userId,
            credential_id: credentialIdBase64,
            public_key: publicKeyBase64,
          },
        });

        if (registerError) {
          console.error('Error registering biometric:', registerError);
          throw new Error('Falha ao registrar credencial no servidor');
        }

        // Armazena localmente apenas após sucesso no backend
        localStorage.setItem('biometric_credential_id', credentialIdBase64);
        localStorage.setItem('biometric_user_id', userId);
        localStorage.setItem('biometric_email', email);
        setIsRegistered(true);
        
        toast.success('Autenticação biométrica ativada com sucesso!');
        return true;
      }

      return false;
    } catch (error: any) {
      console.error('Erro ao registrar biometria:', error);
      
      if (error.name === 'NotAllowedError') {
        toast.error('Registro biométrico cancelado ou negado');
      } else {
        toast.error('Erro ao ativar autenticação biométrica');
      }
      return false;
    }
  };

  const authenticateWithBiometric = async () => {
    try {
      const credentialId = localStorage.getItem('biometric_credential_id');
      const email = localStorage.getItem('biometric_email');

      if (!credentialId || !email) {
        toast.error('Biometria não configurada. Configure nas suas configurações.');
        return null;
      }

      console.log('Starting biometric authentication...');

      // Prepara desafio para autenticação
      const challenge = new Uint8Array(32);
      crypto.getRandomValues(challenge);

      const publicKeyCredentialRequestOptions: PublicKeyCredentialRequestOptions = {
        challenge,
        allowCredentials: [{
          id: Uint8Array.from(atob(credentialId), c => c.charCodeAt(0)),
          type: 'public-key',
          transports: ['internal'],
        }],
        userVerification: "required",
        timeout: 60000,
      };

      const assertion = await navigator.credentials.get({
        publicKey: publicKeyCredentialRequestOptions,
      }) as PublicKeyCredential;

      if (!assertion) {
        return null;
      }

      console.log('Biometric validation successful, calling backend...');

      // Chamar Edge Function para validar e obter sessão
      const { data, error } = await supabase.functions.invoke('biometric-auth', {
        body: {
          credential_id: credentialId,
          email: email,
        },
      });

      if (error) {
        console.error('Backend authentication error:', error);
        throw new Error(error.message || 'Falha na autenticação no servidor');
      }

      if (!data?.access_token) {
        throw new Error('Token de sessão não recebido');
      }

      console.log('Session token received, authenticating...');

      // Usar o magic link token para autenticar
      const { error: signInError } = await supabase.auth.verifyOtp({
        email: email,
        token: data.access_token,
        type: 'magiclink',
      });

      if (signInError) {
        console.error('Sign in error:', signInError);
        throw new Error('Falha ao criar sessão');
      }

      console.log('Authentication successful!');
      return { success: true };

    } catch (error: any) {
      console.error('Erro ao autenticar com biometria:', error);
      
      if (error.name === 'NotAllowedError') {
        toast.error('Autenticação biométrica cancelada');
      } else {
        toast.error(error.message || 'Erro na autenticação biométrica');
      }
      return null;
    }
  };

  const removeBiometric = () => {
    localStorage.removeItem('biometric_credential_id');
    localStorage.removeItem('biometric_user_id');
    localStorage.removeItem('biometric_email');
    setIsRegistered(false);
    toast.success('Autenticação biométrica desativada');
  };

  const isMobileOrTablet = () => {
    return /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
  };

  return {
    isAvailable: isAvailable && isMobileOrTablet(),
    isRegistered,
    loading,
    registerBiometric,
    authenticateWithBiometric,
    removeBiometric,
    checkAvailability,
  };
};
