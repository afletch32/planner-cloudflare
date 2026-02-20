(function () {
  function parseNumber(value) {
    if (value === null || value === undefined || value === '') return null;
    const n = parseInt(value, 10);
    return Number.isFinite(n) ? n : null;
  }

  function extractRewardsFromText(text) {
    if (!text) return { coins: null, crystals: null };
    const coinMatch = text.match(/🪙\s*(\d+)/);
    const crystalMatch = text.match(/💎\s*(\d+)/);
    return {
      coins: coinMatch ? parseNumber(coinMatch[1]) : null,
      crystals: crystalMatch ? parseNumber(crystalMatch[1]) : null,
    };
  }

  function getRewards(card) {
    const datasetCoins = parseNumber(card.dataset.coins);
    const datasetCrystals = parseNumber(card.dataset.crystals);
    if (datasetCoins !== null || datasetCrystals !== null) {
      return { coins: datasetCoins, crystals: datasetCrystals };
    }

    const rewardLine = card.querySelector('.quest-reward');
    if (rewardLine) {
      return extractRewardsFromText(rewardLine.textContent || '');
    }

    const text = card.textContent || '';
    return extractRewardsFromText(text);
  }

  function setRewardLine(card, rewards) {
    const rewardLine = card.querySelector('.quest-reward');
    if (!rewardLine) return;
    if (!rewards.coins && !rewards.crystals) {
      rewardLine.classList.add('hidden');
      return;
    }
    rewardLine.classList.remove('hidden');
  }

  function sparkle(card) {
    card.classList.add('quest-sparkle');
    setTimeout(() => {
      card.classList.remove('quest-sparkle');
    }, 800);
  }

  function floatCoins(card, coins) {
    if (!coins) return;
    const floatEl = document.createElement('div');
    floatEl.className = 'quest-float';
    floatEl.textContent = `+${coins} Coins!`;
    card.appendChild(floatEl);
    setTimeout(() => floatEl.remove(), 900);
  }

  function updateButtonState(card, questBtn, state) {
    const flow = card.dataset.questFlow === 'two-step' ? 'two-step' : 'instant';
    card.dataset.questState = state;
    if (state === 'completed') {
      questBtn.textContent = 'Completed';
      questBtn.disabled = true;
      questBtn.classList.add('opacity-60', 'cursor-not-allowed');
    } else if (flow === 'two-step' && state === 'started') {
      questBtn.textContent = 'Complete Quest';
    } else {
      questBtn.textContent = flow === 'two-step' ? 'Start Quest' : 'Complete Task';
    }
  }

  function initCard(card) {
    const questBtn = card.querySelector('.quest-action');
    if (!questBtn) return;

    const rewards = getRewards(card);
    setRewardLine(card, rewards);

    const rawId = card.dataset.id;
    const taskId = rawId !== undefined ? String(rawId) : null;
    const isCompleted = card.classList.contains('completed');
    updateButtonState(card, questBtn, isCompleted ? 'completed' : 'idle');

    const onCardClick = (event) => {
      if (event.target.closest('button') || event.target.closest('input') || event.target.closest('textarea')) {
        return;
      }
      handleQuestAction(card, questBtn, rewards, taskId);
    };

    if (!card.dataset.questBound) {
      card.addEventListener('click', onCardClick);
      questBtn.addEventListener('click', (event) => {
        event.stopPropagation();
        handleQuestAction(card, questBtn, rewards, taskId);
      });
      card.dataset.questBound = 'true';
    }
  }

  function handleQuestAction(card, questBtn, rewards, taskId) {
    const state = card.dataset.questState || 'idle';
    const flow = card.dataset.questFlow === 'two-step' ? 'two-step' : 'instant';
    if (state === 'completed') return;

    if (flow === 'two-step' && state === 'idle') {
      updateButtonState(card, questBtn, 'started');
      return;
    }

    sparkle(card);
    floatCoins(card, rewards.coins);

    const item = Array.isArray(window.scheduleItems)
      ? window.scheduleItems.find((task) => String(task.id) === taskId)
      : null;

    setTimeout(() => {
      if (typeof window.handleScheduleItemToggle === 'function' && item) {
        window.handleScheduleItemToggle(item);
        if (item.completed) {
          updateButtonState(card, questBtn, 'completed');
          window.dispatchEvent(
            new CustomEvent('questCompleted', {
              detail: {
                coins: rewards.coins || 0,
                crystals: rewards.crystals || 0,
                taskId,
              },
            })
          );
        }
      } else if (typeof window.showCelebration === 'function') {
        window.showCelebration('Quest could not be completed.');
      }
    }, 200);
  }

  function questifyScheduleTasks() {
    const cards = document.querySelectorAll('.schedule-item.quest-card');
    cards.forEach((card) => initCard(card));
  }

  window.questifyScheduleTasks = questifyScheduleTasks;

  document.addEventListener('DOMContentLoaded', () => {
    questifyScheduleTasks();
  });
})();
