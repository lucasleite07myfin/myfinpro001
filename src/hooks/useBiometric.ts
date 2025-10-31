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
        // Armazena ID da credencial
        localStorage.setItem('biometric_credential_id', credential.id);
        localStorage.setItem('biometric_user_id', userId);
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
      const userId = localStorage.getItem('biometric_user_id');

      if (!credentialId || !userId) {
        toast.error('Biometria não configurada. Configure nas suas configurações.');
        return null;
      }

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

      if (assertion) {
        // Retorna o ID do usuário para fazer login
        return userId;
      }

      return null;
    } catch (error: any) {
      console.error('Erro ao autenticar com biometria:', error);
      
      if (error.name === 'NotAllowedError') {
        toast.error('Autenticação biométrica cancelada');
      } else {
        toast.error('Erro na autenticação biométrica');
      }
      return null;
    }
  };

  const removeBiometric = () => {
    localStorage.removeItem('biometric_credential_id');
    localStorage.removeItem('biometric_user_id');
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
