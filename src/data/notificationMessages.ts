/**
 * Mensagens de Notificação Centralizadas
 * 
 * Este arquivo contém todas as mensagens de notificação do sistema.
 * Você pode editar livremente as mensagens para personalizar o tom,
 * estilo e conteúdo enviado aos usuários.
 * 
 * Placeholders disponíveis:
 * - {user_name}: Nome do usuário
 * - {amount}: Valor monetário
 * - {date}: Data formatada
 * - {percent}: Percentual
 * - {count}: Contagem de itens
 */

export const notificationMessages = {
  // ===================================
  // ALERTAS FINANCEIROS
  // ===================================
  alerts: {
    spending_limit: {
      // Limite excedido (> 100%)
      exceeded: {
        title: "⚠️ ALERTA: Limite de Gastos Excedido",
        message: `⚠️ ALERTA: Você excedeu seu limite de gastos!

Gastos do mês: {total_spent}
Limite configurado: {spending_limit}
Excedido em: {exceeded_amount} ({exceeded_percent}%)

💡 Dica: Revise seus gastos e considere ajustar seu orçamento para o próximo mês.`,
        
        whatsapp: `🚨 *Atenção {user_name}!*

Você excedeu seu limite de gastos mensal.

📊 *Resumo:*
• Gastou: *{total_spent}*
• Limite: {spending_limit}
• Excedente: *{exceeded_amount}* ({exceeded_percent}%)

É hora de revisar seus gastos! 💰`,

        email: {
          subject: "⚠️ Limite de Gastos Excedido - {month}",
          body: `Olá {user_name},

Identificamos que você excedeu seu limite de gastos mensal.

📊 DETALHES:
━━━━━━━━━━━━━━━━━━━━━
Gastos do mês: {total_spent}
Limite configurado: {spending_limit}
Valor excedido: {exceeded_amount}
Percentual excedido: {exceeded_percent}%
Mês de referência: {month}

💡 RECOMENDAÇÕES:
• Revise suas despesas do mês
• Identifique gastos que podem ser reduzidos
• Considere ajustar seu limite para o próximo mês
• Acompanhe seus gastos diariamente

Acesse sua conta para ver detalhes completos.

Atenciosamente,
Equipe de Gestão Financeira`
        }
      },

      // Alerta em 75% do limite
      warning_75: {
        title: "⚠️ Atenção: 75% do Limite Atingido",
        message: `⚠️ Você atingiu 75% do seu limite de gastos!

Gastos até agora: {total_spent}
Limite configurado: {spending_limit}
Ainda disponível: {remaining_amount}

💡 Dica: Você está no caminho certo, mas fique atento aos próximos gastos.`,
        
        whatsapp: `⚠️ *Atenção {user_name}!*

Você já gastou 75% do seu limite mensal.

📊 *Status:*
• Gastou: {total_spent}
• Limite: {spending_limit}
• Disponível: {remaining_amount}

Fique atento aos próximos gastos! 👀`
      },

      // Alerta em 90% do limite
      warning_90: {
        title: "🚨 Alerta: 90% do Limite Atingido",
        message: `🚨 ATENÇÃO: Você atingiu 90% do seu limite de gastos!

Gastos até agora: {total_spent}
Limite configurado: {spending_limit}
Ainda disponível: {remaining_amount}

⚠️ Você está próximo de exceder seu limite. Controle seus gastos!`,
        
        whatsapp: `🚨 *ATENÇÃO {user_name}!*

Você já gastou 90% do seu limite mensal!

📊 *Status Crítico:*
• Gastou: {total_spent}
• Limite: {spending_limit}
• Disponível: {remaining_amount}

🛑 Controle urgente necessário!`
      }
    },

    recurring_expenses: {
      // Despesas vencendo em breve
      due_soon: {
        title: "🔔 Despesas Recorrentes Próximas",
        message: `🔔 Você tem {count} despesa(s) vencendo em breve!

Total a pagar: {total_amount}

📋 PRÓXIMAS DESPESAS:
{expenses_list}

💡 Organize-se para evitar atrasos!`,

        whatsapp: `🔔 *Lembrete {user_name}!*

Você tem {count} despesa(s) vencendo em breve.

💰 Total: *{total_amount}*

📋 *Despesas:*
{expenses_list}

Não esqueça de pagar! 📅`,

        email: {
          subject: "🔔 Lembrete: Despesas Vencendo em Breve",
          body: `Olá {user_name},

Você tem despesas recorrentes vencendo nos próximos dias.

📋 DESPESAS PRÓXIMAS:
━━━━━━━━━━━━━━━━━━━━━
{expenses_list_detailed}

💰 TOTAL A PAGAR: {total_amount}

💡 DICAS:
• Confira seu saldo disponível
• Programe os pagamentos com antecedência
• Evite juros e multas por atraso

Acesse sua conta para gerenciar suas despesas.

Atenciosamente,
Equipe de Gestão Financeira`
        }
      },

      // Despesa vencendo hoje
      due_today: {
        title: "⏰ Despesa Vence HOJE!",
        message: `⏰ URGENTE: Despesa vence HOJE!

{description}
Valor: {amount}
Vencimento: HOJE

Pague agora para evitar juros e multas!`,

        whatsapp: `⏰ *URGENTE {user_name}!*

Despesa vence *HOJE*:

📌 {description}
💰 Valor: *{amount}*
📅 Vencimento: *HOJE*

Pague agora! 🚨`
      },

      // Despesas vencidas
      overdue: {
        title: "🚨 Despesas VENCIDAS!",
        message: `🚨 ATENÇÃO: Você tem despesas vencidas!

{count} despesa(s) em atraso
Total: {total_amount}

📋 DESPESAS VENCIDAS:
{expenses_list}

⚠️ Regularize urgentemente para evitar mais juros!`,

        whatsapp: `🚨 *URGENTE {user_name}!*

Você tem {count} despesa(s) *VENCIDA(S)*!

💰 Total: *{total_amount}*

📋 *Em atraso:*
{expenses_list}

Regularize urgente! ⚠️`
      }
    },

    low_balance: {
      title: "⚠️ Saldo Baixo",
      message: `⚠️ Seu saldo está baixo!

Saldo atual: {current_balance}
Despesas previstas: {upcoming_expenses}

💡 Dica: Considere adiar compras não essenciais.`
    }
  },

  // ===================================
  // METAS E INVESTIMENTOS
  // ===================================
  goals: {
    near_completion: {
      title: "🎯 Quase Lá!",
      message: `🎯 Você está quase alcançando sua meta!

Meta: {goal_name}
Progresso: {current_amount} de {target_amount} ({progress}%)
Faltam apenas: {remaining_amount}

Continue assim! 💪`,

      whatsapp: `🎯 *Parabéns {user_name}!*

Sua meta está quase lá!

📊 *{goal_name}*
• Progresso: {progress}%
• Conquistado: {current_amount}
• Falta: {remaining_amount}

Você consegue! 💪`
    },

    achieved: {
      title: "🎉 Meta Alcançada!",
      message: `🎉 PARABÉNS! Você alcançou sua meta!

Meta: {goal_name}
Valor: {target_amount}
Data de conclusão: {date}

Você é incrível! Continue assim! 🌟`,

      whatsapp: `🎉 *PARABÉNS {user_name}!*

Você alcançou sua meta *{goal_name}*!

💰 Valor: {target_amount}
📅 Concluída em: {date}

Você é demais! 🌟🎯`
    },

    contribution_registered: {
      title: "✅ Contribuição Registrada",
      message: `✅ Contribuição registrada com sucesso!

Meta: {goal_name}
Valor contribuído: {amount}
Novo total: {current_amount} de {target_amount}
Progresso: {progress}%

Continue investindo no seu futuro! 💰`
    }
  },

  // ===================================
  // LEMBRETES E DICAS
  // ===================================
  reminders: {
    payment_due: {
      title: "📅 Lembrete de Pagamento",
      message: `📅 Lembrete: Pagamento próximo

{description}
Valor: {amount}
Vencimento: {due_date}
Dias restantes: {days_until}

Não esqueça! ⏰`
    },

    daily_tip: {
      title: "💡 Dica Financeira do Dia",
      messages: [
        "💡 Dica: Reserve 10% de sua renda para emergências.",
        "💡 Dica: Revise seus gastos semanalmente para manter o controle.",
        "💡 Dica: Evite compras por impulso, espere 24h antes de decidir.",
        "💡 Dica: Use o débito automático para não esquecer contas fixas.",
        "💡 Dica: Compare preços antes de fazer grandes compras.",
        "💡 Dica: Acompanhe suas metas financeiras diariamente.",
        "💡 Dica: Estabeleça limites de gastos para cada categoria."
      ]
    },

    monthly_report: {
      title: "📊 Relatório Mensal Disponível",
      message: `📊 Seu relatório mensal está pronto!

Mês: {month}
Total de receitas: {income}
Total de despesas: {expenses}
Saldo: {balance}

Acesse para ver os detalhes completos! 📈`
    },

    saving_suggestion: {
      title: "💰 Sugestão de Economia",
      message: `💰 Identificamos uma oportunidade de economia!

{suggestion_text}

Economia estimada: {estimated_savings}

Considere esta mudança! 💡`
    }
  },

  // ===================================
  // CONQUISTAS
  // ===================================
  achievements: {
    new_badge: {
      title: "🏆 Nova Conquista Desbloqueada!",
      message: `🏆 PARABÉNS! Nova conquista desbloqueada!

{badge_name}
{badge_description}

Continue evoluindo! 🌟`,

      whatsapp: `🏆 *Nova Conquista {user_name}!*

*{badge_name}*
{badge_description}

Você está arrasando! 🌟`
    },

    milestone: {
      title: "🎯 Marco Financeiro Alcançado!",
      message: `🎯 Você alcançou um marco importante!

{milestone_name}
{milestone_description}

Continue nessa trajetória de sucesso! 🚀`
    },

    streak: {
      title: "🔥 Sequência Mantida!",
      message: `🔥 Sequência de {count} dias!

Você está registrando suas transações consistentemente.
Continue assim para manter o controle total! 💪`
    }
  },

  // ===================================
  // MENSAGENS DO SISTEMA
  // ===================================
  system: {
    welcome: {
      title: "👋 Bem-vindo(a)!",
      message: `👋 Olá {user_name}!

Seja bem-vindo(a) ao sistema de gestão financeira.

Configure suas preferências de notificação e comece a controlar suas finanças de forma inteligente! 💰`
    },

    notification_settings_updated: {
      title: "✅ Configurações Atualizadas",
      message: `✅ Suas configurações de notificação foram atualizadas com sucesso!

Você receberá alertas conforme suas preferências.`
    }
  }
};

// Mensagens de erro (para logs e debugging)
export const errorMessages = {
  webhook_failed: "Falha ao enviar webhook para o usuário {user_id}",
  profile_not_found: "Perfil não encontrado para o usuário {user_id}",
  invalid_data: "Dados inválidos recebidos: {details}",
  database_error: "Erro ao acessar o banco de dados: {error}",
  api_error: "Erro na API externa: {service} - {error}"
};
