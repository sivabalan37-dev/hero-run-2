import * as THREE from 'three';
import { AdventureInput } from './Input.js';
import { createHero } from './Hero.js';
import { SunnyNeighborhoodLevel } from './SunnyNeighborhoodLevel.js';
import { stepBody } from './PlatformerPhysics.js';
import { ToyStarPool } from './Combat.js';
import { applyBenjiSpecial, getBenjiFormStats } from './BenjiAbilities.js';
import { applyNobiAirDash } from './NobiAbilities.js';
import {
  getUnlockedCharacters,
  isLevelUnlocked,
  loadCampaignProgress,
  recordLevelCompletion,
  saveCampaignProgress,
  selectCharacter,
} from './CampaignProgress.js';
import { getLevelInfo, PLAYABLE_LEVELS, WORLDS } from './LevelCatalog.js';
import { getBossHudModel } from './BossHUD.js';
import { AudioManager } from '../game/Audio.js';
import { ImpactParticlePool } from './ImpactParticles.js';
import { loadSettings, saveSettings } from './Settings.js';
import { getAchievementProgress } from './Achievements.js';
import { getEquippedTitle, getTitleRewards, selectAchievementTitle } from './Rewards.js';
import { getCampaignSummary } from './CampaignSummary.js';

const FIXED_STEP = 1 / 60;
const CHECKPOINT_KEY = 'hero-run-time-travel-save-v1';

function readCheckpoint(levelNumber) {
  try {
    const value = JSON.parse(localStorage.getItem(CHECKPOINT_KEY) || 'null');
    const savedLevel = Number.isInteger(value?.levelNumber) ? value.levelNumber : 1;
    if (value?.version === 1 && savedLevel === levelNumber && Number.isFinite(value.checkpointX)) {
      return Math.max(-5, Math.min(220, value.checkpointX));
    }
  } catch { /* Treat corrupt or blocked checkpoint storage as a fresh checkpoint. */ }
  return -5;
}

function writeCheckpoint(checkpointX, levelNumber) {
  try {
    localStorage.setItem(CHECKPOINT_KEY, JSON.stringify({
      version: 1,
      levelNumber,
      checkpointX,
      savedAt: Date.now(),
    }));
    return true;
  } catch { return false; }
}

export class AdventureGame {
  constructor({ mount }) {
    this.mount = mount;
    this.state = 'menu';
    this.accumulator = 0;
    this.coins = 0;
    this.shards = 0;
    this.progress = loadCampaignProgress();
    this.levelNumber = Math.min(this.progress.currentLevel, Math.max(...PLAYABLE_LEVELS));
    this.checkpointX = readCheckpoint(this.levelNumber);
    this.attackTimer = 0;
    this.specialTimer = 0;
    this.settings = loadSettings();
    this.audio = new AudioManager({ enabled: this.settings.soundEnabled, volume: this.settings.volume });
    this.bossModes = new Map();

    this.scene = new THREE.Scene();
    this.camera = new THREE.OrthographicCamera(-12, 12, 7, -7, 0.1, 140);
    this.camera.position.set(-3.5, 3, 30);
    this.camera.lookAt(-3.5, 3, 0);

    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: false,
      powerPreference: 'high-performance',
    });
    if (!this.renderer.capabilities.isWebGL2) {
      this.renderer.dispose();
      throw new Error('This browser does not provide WebGL 2. Please update your browser or device.');
    }
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.12;
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.applyGraphicsSettings();
    this.renderer.setSize(mount.clientWidth || window.innerWidth, mount.clientHeight || window.innerHeight, false);
    mount.appendChild(this.renderer.domElement);

    this.level = this.createLevel(this.levelNumber);
    this.hero = createHero(this.scene, this.progress.selectedCharacter, this.checkpointX);
    this.projectiles = new ToyStarPool(this.scene);
    this.impactParticles = new ImpactParticlePool(this.scene);
    this.input = new AdventureInput(document);
    this.clock = new THREE.Clock();

    this.ui = {
      hud: document.querySelector('#hud'),
      overlay: document.querySelector('#overlay'),
      title: document.querySelector('#overlay-title'),
      message: document.querySelector('#overlay-message'),
      start: document.querySelector('#start-button'),
      levelSelectButton: document.querySelector('#level-select-button'),
      levelSelect: document.querySelector('#level-select'),
      levelSelectBack: document.querySelector('#level-select-back'),
      settingsButton: document.querySelector('#settings-button'),
      tutorialButton: document.querySelector('#tutorial-button'),
      tutorialPanel: document.querySelector('#tutorial-panel'),
      tutorialBack: document.querySelector('#tutorial-back'),
      achievementsButton: document.querySelector('#achievements-button'),
      achievementsPanel: document.querySelector('#achievements-panel'),
      achievementsBack: document.querySelector('#achievements-back'),
      rewardsButton: document.querySelector('#rewards-button'),
      rewardsPanel: document.querySelector('#rewards-panel'),
      rewardsBack: document.querySelector('#rewards-back'),
      heroTitle: document.querySelector('#hero-title'),
      settingsPanel: document.querySelector('#settings-panel'),
      settingsBack: document.querySelector('#settings-back'),
      soundEnabled: document.querySelector('#sound-enabled'),
      soundVolume: document.querySelector('#sound-volume'),
      soundVolumeValue: document.querySelector('#sound-volume-value'),
      graphicsQuality: document.querySelector('#graphics-quality'),
      pause: document.querySelector('#pause-button'),
      heroSwitch: document.querySelector('#hero-switch'),
      health: document.querySelector('#health-value'),
      healthLabel: document.querySelector('#health-label'),
      healthFill: document.querySelector('#health-fill'),
      coins: document.querySelector('#coins-value'),
      shards: document.querySelector('#shards-value'),
      levelName: document.querySelector('#level-name'),
      heroName: document.querySelector('#hero-name'),
      toast: document.querySelector('#toast'),
      status: document.querySelector('#status-note'),
      touch: document.querySelector('#touch-controls'),
      transform: document.querySelector('[data-action="transform"]'),
      special: document.querySelector('[data-action="special"]'),
      bossHud: document.querySelector('#boss-hud'),
      bossCard: document.querySelector('#boss-card'),
      bossName: document.querySelector('#boss-name'),
      bossPhase: document.querySelector('#boss-phase'),
      bossHealthTrack: document.querySelector('#boss-health-track'),
      bossHealth: document.querySelector('#boss-health-value'),
      bossHealthFill: document.querySelector('#boss-health-fill'),
      bossWarning: document.querySelector('#boss-warning'),
    };

    this.onResize = () => this.resize();
    this.onVisibility = () => {
      if (document.hidden && this.state === 'running') this.pause();
    };
    this.onStart = () => {
      if (this.state === 'paused') this.resume();
      else this.start();
    };
    this.onPause = () => this.state === 'running'
      ? this.pause()
      : this.state === 'paused' ? this.resume() : null;
    this.onHeroSwitch = () => this.switchCharacter();
    this.onOpenLevelSelect = () => this.openLevelSelection();
    this.onCloseLevelSelect = () => this.closeLevelSelection();
    this.onOpenSettings = () => this.openSettings();
    this.onOpenTutorial = () => this.openTutorial();
    this.onCloseTutorial = () => this.closeTutorial();
    this.onOpenAchievements = () => this.openAchievements();
    this.onCloseAchievements = () => this.closeAchievements();
    this.onOpenRewards = () => this.openRewards();
    this.onCloseRewards = () => this.closeRewards();
    this.onCloseSettings = () => this.closeSettings();
    this.onSoundEnabledChange = () => this.updateSettings({ soundEnabled: this.ui.soundEnabled.checked });
    this.onSoundVolumeChange = () => this.updateSettings({ volume: Number(this.ui.soundVolume.value) });
    this.onGraphicsQualityChange = () => this.updateSettings({ graphicsQuality: this.ui.graphicsQuality.value });
    this.ui.start.addEventListener('click', this.onStart);
    this.ui.levelSelectButton.addEventListener('click', this.onOpenLevelSelect);
    this.ui.levelSelectBack.addEventListener('click', this.onCloseLevelSelect);
    this.ui.settingsButton.addEventListener('click', this.onOpenSettings);
    this.ui.tutorialButton.addEventListener('click', this.onOpenTutorial);
    this.ui.tutorialBack.addEventListener('click', this.onCloseTutorial);
    this.ui.achievementsButton.addEventListener('click', this.onOpenAchievements);
    this.ui.achievementsBack.addEventListener('click', this.onCloseAchievements);
    this.ui.rewardsButton.addEventListener('click', this.onOpenRewards);
    this.ui.rewardsBack.addEventListener('click', this.onCloseRewards);
    this.ui.settingsBack.addEventListener('click', this.onCloseSettings);
    this.ui.soundEnabled.addEventListener('change', this.onSoundEnabledChange);
    this.ui.soundVolume.addEventListener('input', this.onSoundVolumeChange);
    this.ui.graphicsQuality.addEventListener('change', this.onGraphicsQualityChange);
    this.syncSettingsControls();
    this.ui.pause.addEventListener('click', this.onPause);
    this.ui.heroSwitch.addEventListener('click', this.onHeroSwitch);
    window.addEventListener('resize', this.onResize);
    document.addEventListener('visibilitychange', this.onVisibility);

    if (matchMedia('(pointer: coarse)').matches) this.ui.touch.classList.remove('hidden');
    this.resize();
    const info = getLevelInfo(this.levelNumber);
    this.showOverlay(
      'HERO RUN',
      'TIME-TRAVEL ADVENTURE',
      `Help ${this.hero.characterId[0].toUpperCase() + this.hero.characterId.slice(1)} recover the Time Shard in ${info.world}. Collect items, defeat Robo Bugs and reach the portal.`,
      'START LEVEL',
      `${info.title.toUpperCase()} · ${this.progress.completedLevels.length} LEVELS CLEARED`
    );
    this.frame = this.frame.bind(this);
    this.raf = requestAnimationFrame(this.frame);
    this.updateHud();
  }

  createLevel(levelNumber) {
    return new SunnyNeighborhoodLevel(this.scene, { levelNumber });
  }

  resize() {
    const width = Math.max(1, this.mount.clientWidth);
    const height = Math.max(1, this.mount.clientHeight);
    const viewHeight = 14;
    const halfWidth = viewHeight * (width / height) / 2;
    this.camera.left = -halfWidth;
    this.camera.right = halfWidth;
    this.camera.top = viewHeight / 2;
    this.camera.bottom = -viewHeight / 2;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height, false);
    this.renderer.setPixelRatio(this.getPixelRatio());
  }

  getPixelRatio() {
    const caps = { low: 1, medium: 1.5, high: 2 };
    return Math.min(window.devicePixelRatio || 1, caps[this.settings.graphicsQuality] || 1.5);
  }

  applyGraphicsSettings() {
    const quality = this.settings.graphicsQuality;
    this.renderer.shadowMap.enabled = quality !== 'low';
    this.renderer.setPixelRatio(this.getPixelRatio());
  }

  syncSettingsControls() {
    this.ui.soundEnabled.checked = this.settings.soundEnabled;
    this.ui.soundVolume.value = String(this.settings.volume);
    this.ui.soundVolumeValue.textContent = `${Math.round(this.settings.volume * 100)}%`;
    this.ui.graphicsQuality.value = this.settings.graphicsQuality;
  }

  updateSettings(changes) {
    this.settings = { ...this.settings, ...changes };
    saveSettings(this.settings);
    this.audio.setEnabled(this.settings.soundEnabled);
    this.audio.setVolume(this.settings.volume);
    this.applyGraphicsSettings();
    this.syncSettingsControls();
  }

  openSettings() {
    if (['running', 'paused', 'gameover'].includes(this.state)) return;
    this.ui.tutorialPanel.classList.add('hidden');
    this.ui.tutorialBack.classList.add('hidden');
    this.ui.message.classList.add('hidden');
    this.ui.start.classList.add('hidden');
    this.ui.levelSelect.classList.add('hidden');
    this.ui.levelSelectButton.classList.add('hidden');
    this.ui.levelSelectBack.classList.add('hidden');
    this.ui.tutorialButton.classList.add('hidden');
    this.ui.achievementsButton.classList.add('hidden');
    this.ui.achievementsPanel.classList.add('hidden');
    this.ui.achievementsBack.classList.add('hidden');
    this.ui.rewardsButton.classList.add('hidden');
    this.ui.rewardsPanel.classList.add('hidden');
    this.ui.rewardsBack.classList.add('hidden');
    this.ui.settingsButton.classList.add('hidden');
    this.ui.settingsPanel.classList.remove('hidden');
    this.ui.settingsBack.classList.remove('hidden');
    this.ui.title.textContent = 'GAME SETTINGS';
    this.ui.status.textContent = 'SOUND · PERFORMANCE · SAVED ON THIS DEVICE';
    this.syncSettingsControls();
  }

  closeSettings() {
    if (!this._overlayModel) return;
    this.ui.settingsPanel.classList.add('hidden');
    this.ui.settingsBack.classList.add('hidden');
    this.showOverlay(this._overlayModel.title, this._overlayModel.subtitle, this._overlayModel.message, this._overlayModel.buttonText, this._overlayModel.status);
  }

  openAchievements() {
    if (['running', 'paused', 'gameover'].includes(this.state)) return;
    this.renderAchievements();
    this.ui.message.classList.add('hidden');
    this.ui.start.classList.add('hidden');
    this.ui.levelSelect.classList.add('hidden');
    this.ui.levelSelectButton.classList.add('hidden');
    this.ui.levelSelectBack.classList.add('hidden');
    this.ui.settingsButton.classList.add('hidden');
    this.ui.settingsPanel.classList.add('hidden');
    this.ui.settingsBack.classList.add('hidden');
    this.ui.achievementsButton.classList.add('hidden');
    this.ui.achievementsPanel.classList.add('hidden');
    this.ui.tutorialButton.classList.add('hidden');
    this.ui.tutorialPanel.classList.add('hidden');
    this.ui.tutorialBack.classList.add('hidden');
    this.ui.achievementsButton.classList.add('hidden');
    this.ui.rewardsButton.classList.add('hidden');
    this.ui.rewardsPanel.classList.add('hidden');
    this.ui.rewardsBack.classList.add('hidden');
    this.ui.achievementsPanel.classList.remove('hidden');
    this.ui.achievementsBack.classList.remove('hidden');
    this.ui.title.textContent = 'ACHIEVEMENTS';
    const unlocked = getAchievementProgress(this.progress).filter(item => item.unlocked).length;
    this.ui.status.textContent = `${unlocked} OF 10 ACHIEVEMENTS UNLOCKED`;
  }

  renderAchievements() {
    const entries = getAchievementProgress(this.progress);
    this.ui.achievementsPanel.replaceChildren();
    for (const achievement of entries) {
      const card = document.createElement('article');
      card.className = `achievement-card${achievement.unlocked ? ' unlocked' : ''}`;
      const heading = document.createElement('div');
      heading.className = 'achievement-heading';
      const title = document.createElement('strong');
      title.textContent = achievement.title;
      const state = document.createElement('span');
      state.textContent = achievement.unlocked ? 'UNLOCKED' : achievement.progressText;
      heading.append(title, state);
      const description = document.createElement('p');
      description.textContent = achievement.description;
      const track = document.createElement('div');
      track.className = 'achievement-track';
      track.setAttribute('role', 'progressbar');
      track.setAttribute('aria-label', `${achievement.title} progress`);
      track.setAttribute('aria-valuemin', '0');
      track.setAttribute('aria-valuemax', String(achievement.target));
      track.setAttribute('aria-valuenow', String(achievement.value));
      const fill = document.createElement('div');
      fill.className = 'achievement-fill';
      fill.style.width = `${Math.round(achievement.value / achievement.target * 100)}%`;
      track.appendChild(fill);
      const reward = document.createElement('small');
      reward.textContent = `TITLE · ${achievement.reward}`;
      card.append(heading, description, track, reward);
      this.ui.achievementsPanel.appendChild(card);
    }
  }

  closeAchievements() {
    if (!this._overlayModel) return;
    this.ui.achievementsPanel.classList.add('hidden');
    this.ui.achievementsBack.classList.add('hidden');
    this.showOverlay(this._overlayModel.title, this._overlayModel.subtitle, this._overlayModel.message, this._overlayModel.buttonText, this._overlayModel.status);
  }

  openRewards() {
    if (['running', 'paused', 'gameover'].includes(this.state)) return;
    this.renderTitleRewards();
    this.ui.message.classList.add('hidden');
    this.ui.start.classList.add('hidden');
    this.ui.levelSelect.classList.add('hidden');
    this.ui.levelSelectButton.classList.add('hidden');
    this.ui.levelSelectBack.classList.add('hidden');
    this.ui.settingsButton.classList.add('hidden');
    this.ui.settingsPanel.classList.add('hidden');
    this.ui.settingsBack.classList.add('hidden');
    this.ui.tutorialButton.classList.add('hidden');
    this.ui.tutorialPanel.classList.add('hidden');
    this.ui.tutorialBack.classList.add('hidden');
    this.ui.achievementsButton.classList.add('hidden');
    this.ui.achievementsPanel.classList.add('hidden');
    this.ui.achievementsBack.classList.add('hidden');
    this.ui.rewardsButton.classList.add('hidden');
    this.ui.rewardsPanel.classList.remove('hidden');
    this.ui.rewardsBack.classList.remove('hidden');
    this.ui.title.textContent = 'REWARDS & TITLES';
    const unlocked = getTitleRewards(this.progress).filter(item => item.unlocked).length;
    this.ui.status.textContent = `${unlocked} OF 10 TITLES EARNED · EQUIP ONE TO SHOW IN GAME`;
  }

  renderTitleRewards() {
    this.ui.rewardsPanel.replaceChildren();
    const equipped = getEquippedTitle(this.progress);
    for (const reward of getTitleRewards(this.progress)) {
      const card = document.createElement('article');
      card.className = `reward-card${reward.unlocked ? ' unlocked' : ' locked'}`;
      const heading = document.createElement('strong');
      heading.textContent = reward.title;
      const source = document.createElement('p');
      source.textContent = reward.achievementTitle;
      const state = document.createElement('small');
      state.textContent = !reward.unlocked ? 'LOCKED · COMPLETE ACHIEVEMENT' :
        equipped?.id === reward.id ? 'CURRENTLY EQUIPPED' : 'UNLOCKED';
      const action = document.createElement('button');
      action.type = 'button';
      action.className = 'reward-equip-button';
      action.disabled = !reward.unlocked;
      action.textContent = equipped?.id === reward.id ? 'EQUIPPED' : 'EQUIP TITLE';
      action.setAttribute('aria-label', `${equipped?.id === reward.id ? 'Currently equipped' : 'Equip'} ${reward.title} title`);
      action.addEventListener('click', () => {
        const next = selectAchievementTitle(this.progress, reward.id);
        if (!next) return;
        this.progress = next;
        saveCampaignProgress(this.progress);
        this.renderTitleRewards();
        this.updateHud();
        this.ui.status.textContent = `${reward.title.toUpperCase()} TITLE EQUIPPED`;
      });
      card.append(heading, source, state, action);
      this.ui.rewardsPanel.appendChild(card);
    }
    const clear = document.createElement('button');
    clear.type = 'button';
    clear.className = 'reward-clear-button';
    clear.textContent = 'REMOVE EQUIPPED TITLE';
    clear.disabled = !equipped;
    clear.addEventListener('click', () => {
      this.progress = selectAchievementTitle(this.progress, null);
      saveCampaignProgress(this.progress);
      this.renderTitleRewards();
      this.updateHud();
      this.ui.status.textContent = 'TITLE REMOVED';
    });
    this.ui.rewardsPanel.appendChild(clear);
  }

  closeRewards() {
    if (!this._overlayModel) return;
    this.ui.rewardsPanel.classList.add('hidden');
    this.ui.rewardsBack.classList.add('hidden');
    this.showOverlay(this._overlayModel.title, this._overlayModel.subtitle, this._overlayModel.message, this._overlayModel.buttonText, this._overlayModel.status);
  }

  openTutorial() {
    if (['running', 'paused', 'gameover'].includes(this.state)) return;
    this.ui.message.classList.add('hidden');
    this.ui.start.classList.add('hidden');
    this.ui.levelSelect.classList.add('hidden');
    this.ui.levelSelectButton.classList.add('hidden');
    this.ui.levelSelectBack.classList.add('hidden');
    this.ui.settingsButton.classList.add('hidden');
    this.ui.settingsPanel.classList.add('hidden');
    this.ui.settingsBack.classList.add('hidden');
    this.ui.achievementsButton.classList.add('hidden');
    this.ui.achievementsPanel.classList.add('hidden');
    this.ui.achievementsBack.classList.add('hidden');
    this.ui.rewardsButton.classList.add('hidden');
    this.ui.rewardsPanel.classList.add('hidden');
    this.ui.rewardsBack.classList.add('hidden');
    this.ui.tutorialButton.classList.add('hidden');
    this.ui.tutorialPanel.classList.remove('hidden');
    this.ui.tutorialBack.classList.remove('hidden');
    this.ui.title.textContent = 'HOW TO PLAY';
    this.ui.status.textContent = 'CONTROLS · HEROES · LEVEL TIPS';
  }

  closeTutorial() {
    if (!this._overlayModel) return;
    this.ui.tutorialPanel.classList.add('hidden');
    this.ui.tutorialBack.classList.add('hidden');
    this.showOverlay(this._overlayModel.title, this._overlayModel.subtitle, this._overlayModel.message, this._overlayModel.buttonText, this._overlayModel.status);
  }

  showOverlay(title, subtitle, message, buttonText, status = '') {
    this._overlayModel = { title, subtitle, message, buttonText, status };
    this.ui.title.textContent = title;
    this.ui.message.textContent = message;
    this.ui.start.textContent = buttonText;
    this.ui.status.textContent = status || subtitle;
    this.ui.message.classList.remove('hidden');
    this.ui.start.classList.remove('hidden');
    this.ui.levelSelect.classList.add('hidden');
    this.ui.levelSelectBack.classList.add('hidden');
    this.ui.settingsPanel.classList.add('hidden');
    this.ui.settingsBack.classList.add('hidden');
    this.ui.tutorialPanel.classList.add('hidden');
    this.ui.tutorialBack.classList.add('hidden');
    this.ui.achievementsPanel.classList.add('hidden');
    this.ui.achievementsBack.classList.add('hidden');
    this.ui.rewardsPanel.classList.add('hidden');
    this.ui.rewardsBack.classList.add('hidden');
    const menuOnly = this.state === 'paused' || this.state === 'gameover';
    this.ui.achievementsButton.classList.toggle('hidden', menuOnly);
    this.ui.rewardsButton.classList.toggle('hidden', menuOnly);
    this.ui.settingsButton.classList.toggle('hidden', menuOnly);
    this.ui.tutorialButton.classList.toggle('hidden', this.state === 'paused' || this.state === 'gameover');
    this.ui.levelSelectButton.classList.toggle('hidden', this.state === 'paused' || this.state === 'gameover');
    this.ui.overlay.classList.remove('hidden');
    this.ui.hud.classList.add('hidden');
    this.ui.touch.classList.add('hidden');
    this.ui.bossHud.classList.add('hidden');
  }

  openLevelSelection() {
    if (this.state === 'paused' || this.state === 'gameover' || this.state === 'running') return;
    this.renderLevelSelection();
    this.ui.title.textContent = 'CHOOSE YOUR LEVEL';
    this.ui.message.classList.add('hidden');
    this.ui.start.classList.add('hidden');
    this.ui.levelSelectButton.classList.add('hidden');
    this.ui.settingsButton.classList.add('hidden');
    this.ui.tutorialButton.classList.add('hidden');
    this.ui.achievementsButton.classList.add('hidden');
    this.ui.rewardsButton.classList.add('hidden');
    this.ui.rewardsPanel.classList.add('hidden');
    this.ui.rewardsBack.classList.add('hidden');
    this.ui.levelSelectBack.classList.remove('hidden');
    this.ui.levelSelect.classList.remove('hidden');
    this.ui.status.textContent = `${this.progress.completedLevels.length} OF 40 LEVELS CLEARED · ${this.progress.totalCoins} COINS`;
  }

  closeLevelSelection() {
    if (!this._overlayModel) return;
    const { title, subtitle, message, buttonText, status } = this._overlayModel;
    this.showOverlay(title, subtitle, message, buttonText, status);
  }

  renderLevelSelection() {
    this.ui.levelSelect.replaceChildren();
    for (const world of WORLDS) {
      const heading = document.createElement('h2');
      heading.className = 'level-world-heading';
      heading.textContent = world.name;
      this.ui.levelSelect.appendChild(heading);

      for (let level = world.firstLevel; level <= world.lastLevel; level++) {
        const info = getLevelInfo(level);
        const unlocked = isLevelUnlocked(this.progress, level);
        const completed = this.progress.completedLevels.includes(level);
        const stars = this.progress.starsByLevel[level] || 0;
        const button = document.createElement('button');
        button.type = 'button';
        button.className = 'level-tile';
        if (completed) button.classList.add('completed');
        if (level === this.progress.currentLevel) button.classList.add('current');
        button.disabled = !unlocked;
        button.setAttribute('aria-label', unlocked
          ? `Level ${level}: ${info.title}. ${completed ? `${stars} stars, completed` : 'uncompleted'}`
          : `Level ${level}: locked`);
        const number = document.createElement('span');
        number.textContent = unlocked ? `LEVEL ${level}` : `🔒 ${level}`;
        const detail = document.createElement('small');
        detail.textContent = completed
          ? `${'★'.repeat(stars)}${'☆'.repeat(3 - stars)}`
          : unlocked ? (info.isBossLevel ? 'BOSS STAGE' : 'PLAY NOW') : 'LOCKED';
        button.append(number, detail);
        if (unlocked) button.addEventListener('click', () => this.chooseLevel(level));
        this.ui.levelSelect.appendChild(button);
      }
    }
  }

  chooseLevel(levelNumber) {
    if (!isLevelUnlocked(this.progress, levelNumber)) return;
    this.levelNumber = levelNumber;
    this.checkpointX = readCheckpoint(levelNumber);
    this.state = 'menu';
    this.resetLevel();
    const info = getLevelInfo(levelNumber);
    this.showOverlay(
      `LEVEL ${levelNumber} READY`,
      info.world,
      `${info.title}. Recover the Time Shard, collect coins and reach the exit.`,
      'START LEVEL',
      `${info.world.toUpperCase()} · ${levelNumber} / 40`
    );
  }

  hideOverlay() {
    this.ui.overlay.classList.add('hidden');
    this.ui.hud.classList.remove('hidden');
    if (matchMedia('(pointer: coarse)').matches) this.ui.touch.classList.remove('hidden');
    this.updateBossHud();
  }

  start() {
    this.audio.resume();
    if (this.state === 'completed') {
      this.levelNumber = Math.min(this.progress.currentLevel, Math.max(...PLAYABLE_LEVELS));
      this.checkpointX = readCheckpoint(this.levelNumber);
      this.resetLevel();
    } else if (this.state === 'gameover') {
      this.checkpointX = readCheckpoint(this.levelNumber);
      this.resetLevel();
    }
    this.state = 'running';
    this.accumulator = 0;
    this.clock.getDelta();
    this.input.clear();
    this.hideOverlay();
    this.updateHud();
  }

  resetLevel() {
    this.level.destroy();
    this.bossModes.clear();
    this.level = this.createLevel(this.levelNumber);
    this.hero.reset(this.checkpointX);
    this.coins = 0;
    this.shards = 0;
    this.attackTimer = 0;
    this.specialTimer = 0;
    this.projectiles.clear();
    this.impactParticles.clear();
    this.updateHud();
  }

  pause() {
    if (this.state !== 'running') return;
    this.state = 'paused';
    this.input.clear();
    this.showOverlay('PAUSED', getLevelInfo(this.levelNumber).world, 'Your progress in this level is kept. Continue when you are ready.', 'RESUME');
  }

  resume() {
    if (this.state !== 'paused') return;
    this.state = 'running';
    this.accumulator = 0;
    this.clock.getDelta();
    this.input.clear();
    this.hideOverlay();
  }

  toast(message) {
    this.ui.toast.textContent = message;
    this.ui.toast.classList.remove('hidden');
    clearTimeout(this.toastTimer);
    this.toastTimer = setTimeout(() => this.ui.toast.classList.add('hidden'), 1300);
  }

  updateHud() {
    const info = getLevelInfo(this.levelNumber);
    this.ui.healthLabel.textContent = `${this.hero.characterId.toUpperCase()} · HEALTH`;
    this.ui.health.textContent = String(Math.max(0, Math.ceil(this.hero.health)));
    this.ui.healthFill.style.width = `${Math.max(0, this.hero.health)}%`;
    this.ui.coins.textContent = String(this.coins);
    this.ui.shards.textContent = String(this.shards);
    this.ui.levelName.textContent = `${info.world.toUpperCase()} · LEVEL ${this.levelNumber} / 40`;
    const benjiForm = this.hero.characterId === 'benji' ? this.hero.forms[this.hero.formIndex] : null;
    this.ui.heroName.textContent = benjiForm ? `BENJI · ${benjiForm.toUpperCase()}` : this.hero.characterId.toUpperCase();
    const equippedTitle = getEquippedTitle(this.progress);
    this.ui.heroTitle.textContent = equippedTitle ? equippedTitle.title.toUpperCase() : '';
    this.ui.heroTitle.classList.toggle('hidden', !equippedTitle);
    this.ui.heroSwitch.textContent = `HERO: ${this.hero.characterId.toUpperCase()}`;
    this.ui.healthFill.style.background = this.hero.health <= 30
      ? 'linear-gradient(90deg,#ff4d66,#ffad51)'
      : 'linear-gradient(90deg,#42e49a,#f6d95a)';
    this.ui.transform.classList.toggle('hidden', this.hero.characterId !== 'benji');
    this.ui.special.textContent = this.hero.characterId === 'nobi'
      ? 'GADGET / DASH'
      : benjiForm && benjiForm !== 'normal' ? getBenjiFormStats(benjiForm).specialLabel : 'BURST';
    this.updateBossHud();
  }

  updateBossHud() {
    const boss = this.level.enemies.find(enemy => enemy.isBoss);
    const model = getBossHudModel(boss);
    this.ui.bossHud.classList.toggle('hidden', !model);
    if (!model) return;

    this.ui.bossName.textContent = model.name;
    this.ui.bossPhase.textContent = model.phaseText;
    this.ui.bossHealth.textContent = model.healthText;
    this.ui.bossHealthFill.style.width = `${model.healthPercent}%`;
    this.ui.bossHealthTrack.setAttribute('aria-valuemax', String(Math.ceil(model.maxHealth)));
    this.ui.bossHealthTrack.setAttribute('aria-valuenow', String(Math.ceil(model.health)));
    this.ui.bossCard.classList.toggle('warning', model.warning);
    this.ui.bossWarning.classList.toggle('hidden', !model.warning && !model.defeated);
    this.ui.bossWarning.classList.toggle('defeated', model.defeated);
    this.ui.bossWarning.textContent = model.statusText;
  }

  switchCharacter() {
    if (this.state !== 'running' && this.state !== 'menu' && this.state !== 'paused') return;
    const unlocked = getUnlockedCharacters(this.progress);
    if (unlocked.length < 2) {
      this.toast('NOBI UNLOCKS AFTER LEVEL 3');
      return;
    }
    const currentIndex = unlocked.indexOf(this.hero.characterId);
    const nextId = unlocked[(currentIndex + 1) % unlocked.length];
    const nextProgress = selectCharacter(this.progress, nextId);
    if (!nextProgress) return;

    const oldHero = this.hero;
    const position = { ...oldHero.body };
    const health = oldHero.health;
    const invulnerable = oldHero.invulnerable;
    this.hero = createHero(this.scene, nextId, position.x);
    this.hero.body = position;
    this.hero.body.maxAirJumps = this.hero.maxAirJumps || 0;
    this.hero.body.airJumpsRemaining = this.hero.body.grounded
      ? this.hero.body.maxAirJumps
      : Math.min(this.hero.body.maxAirJumps, position.airJumpsRemaining ?? this.hero.body.maxAirJumps);
    this.hero.body.airDashTimer = 0;
    this.hero.health = health;
    this.hero.invulnerable = invulnerable;
    this.hero.syncVisual();
    oldHero.destroy();
    this.progress = nextProgress;
    saveCampaignProgress(this.progress);
    this.projectiles.clear();
    this.toast(`${nextId.toUpperCase()} SELECTED`);
    this.updateHud();
  }

  collect(item) {
    if (item.collected) return;
    item.collected = true;
    item.group.visible = false;
    if (item.type === 'coin') {
      this.coins += 1;
      this.audio.coin();
      this.toast('+1 COIN');
    } else if (item.type === 'heart') {
      this.hero.health = Math.min(100, this.hero.health + 25);
      this.audio.power();
      this.toast('HEALTH RESTORED');
    } else {
      this.shards += 1;
      this.audio.power();
      this.toast('TIME SHARD FOUND!');
    }
    this.updateHud();
  }

  completeLevel() {
    const alreadyCompleted = this.progress.completedLevels.includes(this.levelNumber);
    const previouslyUnlockedAchievements = new Set(getAchievementProgress(this.progress).filter(item => item.unlocked).map(item => item.id));
    const starsEarned = this.shards > 0
      ? (this.hero.health >= 75 ? 3 : 2)
      : 1;
    this.progress = recordLevelCompletion(
      this.progress,
      this.levelNumber,
      alreadyCompleted ? 0 : this.coins,
      starsEarned
    );
    saveCampaignProgress(this.progress);
    const bestStars = this.progress.starsByLevel[this.levelNumber] || starsEarned;

    this.state = 'completed';
    this.audio.levelComplete();
    this.input.clear();
    const nextLevel = this.progress.currentLevel;
    const nextInfo = nextLevel <= 40 ? getLevelInfo(nextLevel) : null;
    const newlyUnlocked = getUnlockedCharacters(this.progress);
    const nobiUnlocked = newlyUnlocked.includes('nobi') && !this._nobiUnlockAnnounced;
    const benjiUnlocked = newlyUnlocked.includes('benji') && !this._benjiUnlockAnnounced;
    if (nobiUnlocked) this._nobiUnlockAnnounced = true;
    if (benjiUnlocked) this._benjiUnlockAnnounced = true;
    const starDisplay = '★'.repeat(bestStars) + '☆'.repeat(3 - bestStars);
    let message = `${getLevelInfo(this.levelNumber).title} cleared. Rating: ${starDisplay}. Coins collected: ${this.coins}.`;
    if (starsEarned < bestStars) message += ` Your best rating remains ${bestStars} stars.`;
    if (nobiUnlocked) message += ' Nobi is now unlocked!';
    if (benjiUnlocked) message += ' Benji is now unlocked!';
    const newlyUnlockedAchievements = getAchievementProgress(this.progress).filter(item => item.unlocked && !previouslyUnlockedAchievements.has(item.id));
    if (newlyUnlockedAchievements.length) message += ` Achievement unlocked: ${newlyUnlockedAchievements.map(item => item.title).join(', ')}.`;
    const campaignSummary = getCampaignSummary(this.progress);
    if (campaignSummary.campaignComplete) {
      const finalStars = '★'.repeat(bestStars) + '☆'.repeat(3 - bestStars);
      message += ` Final rating: ${finalStars}. All 40 levels are cleared, all ${campaignSummary.totalStars}/${campaignSummary.maxStars} campaign stars are recorded, ${campaignSummary.totalCoins} campaign coins collected, and ${campaignSummary.completedBossLevels}/${campaignSummary.totalBossLevels} bosses defeated.`;
      message += ' You restored the timeline and completed the Hero Run adventure!';
      this.showOverlay('CAMPAIGN COMPLETE!', 'THE TIMELINE IS SAVED', message, 'REPLAY FINAL LEVEL', '40 / 40 LEVELS · CAMPAIGN VICTORY');
    } else if (PLAYABLE_LEVELS.includes(nextLevel)) {
      message += ` Next: ${nextInfo.title}.`;
      this.showOverlay('LEVEL COMPLETE!', 'Time Shard recovered', message, `PLAY LEVEL ${nextLevel}`);
    } else {
      message += ' Your campaign progress is saved. Replay any unlocked level from Level Select.';
      this.showOverlay('LEVEL COMPLETE!', 'Time Shard recovered', message, 'REPLAY LEVEL');
    }
  }

  damageHero(source = null) {
    if (this.hero.invulnerable > 0) return;
    const benjiForm = this.hero.characterId === 'benji' ? this.hero.forms[this.hero.formIndex] : null;
    const damageMultiplier = benjiForm ? getBenjiFormStats(benjiForm).damageMultiplier : 1;
    this.hero.health = Math.max(0, this.hero.health - Math.round(25 * damageMultiplier));
    this.hero.invulnerable = 1.1;
    this.audio.hit();
    this.toast(source?.isBoss
      ? `${source.bossName.toUpperCase()} ATTACK!`
      : source ? `${(source.enemyName || 'ENEMY').toUpperCase()} HIT!` : 'FALL DAMAGE!');
    this.updateHud();
    if (this.hero.health <= 0) {
      this.audio.gameOver();
      this.state = 'gameover';
      this.input.clear();
      this.showOverlay('TRY AGAIN', 'Checkpoint ready', `${this.hero.characterId[0].toUpperCase() + this.hero.characterId.slice(1)} ran out of health. Restart from the most recently activated checkpoint.`, 'RESPAWN');
    }
  }

  fixedUpdate(dt) {
    const move = this.input.movement();
    const jumpPressed = this.input.consumePressed('jump');
    const attackPressed = this.input.consumePressed('attack');
    const specialPressed = this.input.consumePressed('special');
    const switchPressed = this.input.consumePressed('switch');
    const transformPressed = this.input.consumePressed('transform');

    if (switchPressed) this.switchCharacter();
    if (transformPressed) {
      if (this.hero.characterId === 'benji') {
        const form = this.hero.cycleForm();
        this.audio.formShift();
        this.toast(`BENJI: ${form.toUpperCase()} FORM`);
      }
    }

    const body = this.hero.body;
    const benjiForm = this.hero.characterId === 'benji' ? this.hero.forms[this.hero.formIndex] : null;
    const movementTuning = benjiForm ? getBenjiFormStats(benjiForm).movement : null;
    const glide = this.hero.characterId === 'nobi' && !body.grounded && this.input.isDown('jump');
    stepBody(body, { move, jumpPressed, glide }, this.level.platforms, dt, { minX: -9, maxX: this.level.exitX + 2 }, movementTuning);
    this.level.update(dt, body);
    for (const enemy of this.level.enemies) {
      if (!enemy.isBoss) continue;
      const previousMode = this.bossModes.get(enemy.bossName);
      if (enemy.bossMode === 'telegraph' && previousMode !== 'telegraph') {
        this.audio.bossWarning(enemy.attackType);
      }
      if (enemy.attackPulse) this.audio.bossAttack(enemy.attackType);
      this.bossModes.set(enemy.bossName, enemy.bossMode);
    }
    this.attackTimer = Math.max(0, this.attackTimer - dt);
    this.specialTimer = Math.max(0, this.specialTimer - dt);

    if (attackPressed && this.attackTimer <= 0) {
      if (this.projectiles.fireToyStar(body.x, body.y + 1.28, body.facing)) {
        this.attackTimer = 0.34;
      }
    }
    if (specialPressed && this.specialTimer <= 0) {
      if (this.hero.characterId === 'nobi') {
        if (!body.grounded) {
          const dashed = applyNobiAirDash(body);
          if (dashed) {
            this.specialTimer = 4.2;
            this.audio.airDash();
            this.toast('NOBI AIR DASH!');
          } else {
            this.toast('AIR DASH NOT READY');
          }
        } else {
          const revealed = this.level.triggerGadgetVision(body.x);
          this.audio.gadgetScan();
          this.specialTimer = 4.2;
          this.toast(revealed ? `GADGET VISION · ${revealed} SECRET REVEALED` : 'GADGET VISION · AREA SCANNED');
        }
      } else if (benjiForm && benjiForm !== 'normal') {
        const result = applyBenjiSpecial(benjiForm, body, this.level.enemies);
        if (!result.ready) {
          this.toast('TITAN STOMP REQUIRES THE GROUND');
        } else {
          this.specialTimer = getBenjiFormStats(benjiForm).specialCooldown;
          this.audio.power();
          if (result.ready && result.ability !== 'star-burst') this.hero.triggerSpecialEffect(result.ability);
          if (result.defeated > 0) this.coins += result.defeated * 2;
          const labels = { flame: 'BLAZE STRIKE', shock: 'SHOCK PULSE', stomp: 'TITAN STOMP' };
          this.toast(result.hits > 0 ? `${labels[result.ability]} · ${result.hits} HIT(S)` : `${labels[result.ability]} · NO TARGET`);
        }
      } else {
        const fired = this.projectiles.fireStarBurst(body.x, body.y + 1.18, body.facing);
        if (fired > 0) {
          this.specialTimer = 4.2;
          this.toast('STAR BURST!');
        }
      }
    }

    const combatResult = this.projectiles.update(dt, this.level.enemies, (x, y, isBoss) => {
      this.impactParticles.spawn(x, y, isBoss);
    });
    this.impactParticles.update(dt);
    if (combatResult.defeated > 0) {
      this.coins += combatResult.defeated * 2;
      this.toast(`ENEMY DEFEATED · +${combatResult.defeated * 2}`);
    }
    for (const item of this.level.collectibles) {
      if (item.collected) continue;
      const dx = Math.abs(body.x - item.x);
      const dy = Math.abs(body.y + body.height * 0.55 - item.y);
      if (dx < 0.82 && dy < 1.2) this.collect(item);
    }

    for (const enemy of this.level.enemies) {
      if (!enemy.alive || !enemy.attackPulse) continue;
      const hitRange = enemy.attackRange ?? (enemy.isBoss ? 2.6 : 1.5);
      const maxHeroY = enemy.attackHeight ?? (enemy.isBoss ? 1.35 : 1.05);
      if (Math.abs(body.x - enemy.x) <= hitRange && Math.max(0, body.y) <= maxHeroY) {
        this.damageHero(enemy);
      }
    }

    if (!this.level.checkpointActivated && body.x >= this.level.checkpointX) {
      this.level.checkpointActivated = true;
      this.checkpointX = this.level.checkpointX;
      writeCheckpoint(this.checkpointX, this.levelNumber);
      this.toast('CHECKPOINT SAVED');
    }

    if (body.y < -9) {
      body.x = this.checkpointX;
      body.y = 0;
      body.vx = 0;
      body.vy = 0;
      body.grounded = false;
      this.damageHero();
    }

    if (body.x >= this.level.exitX) {
      const livingBoss = this.level.enemies.find(enemy => enemy.isBoss && enemy.alive);
      if (livingBoss) {
        body.x = this.level.exitX - 1.2;
        this.toast(`${livingBoss.bossName.toUpperCase()} MUST BE DEFEATED`);
      } else if (this.shards > 0) this.completeLevel();
      else {
        body.x = this.level.exitX - 1.2;
        this.toast('FIND THE TIME SHARD FIRST');
      }
    }

    this.hero.update(dt, this.attackTimer > 0, {
      gliding: this.hero.characterId === 'nobi' && glide && body.vy < 0,
      dashing: this.hero.characterId === 'nobi' && body.airDashTimer > 0,
    });
    this.updateHud();
    this.input.endStep();
  }

  frame() {
    this.raf = requestAnimationFrame(this.frame);
    const elapsed = Math.min(this.clock.getDelta(), 0.1);
    if (this.state === 'running') {
      this.accumulator = Math.min(this.accumulator + elapsed, FIXED_STEP * 6);
      let steps = 0;
      while (this.accumulator >= FIXED_STEP && steps < 6 && this.state === 'running') {
        this.fixedUpdate(FIXED_STEP);
        this.accumulator -= FIXED_STEP;
        steps++;
      }
    } else {
      this.accumulator = 0;
    }

    const cameraMaxX = Math.max(34, this.level.exitX - 6);
    const targetX = Math.max(-4, Math.min(cameraMaxX, this.hero.body.x + 1.5));
    this.camera.position.x += (targetX - this.camera.position.x) * 0.09;
    this.camera.lookAt(this.camera.position.x, 3, 0);
    this.renderer.render(this.scene, this.camera);
  }

  destroy() {
    cancelAnimationFrame(this.raf);
    clearTimeout(this.toastTimer);
    this.input.destroy();
    this.ui.start.removeEventListener('click', this.onStart);
    this.ui.levelSelectButton.removeEventListener('click', this.onOpenLevelSelect);
    this.ui.levelSelectBack.removeEventListener('click', this.onCloseLevelSelect);
    this.ui.settingsButton.removeEventListener('click', this.onOpenSettings);
    this.ui.settingsBack.removeEventListener('click', this.onCloseSettings);
    this.ui.tutorialButton.removeEventListener('click', this.onOpenTutorial);
    this.ui.tutorialBack.removeEventListener('click', this.onCloseTutorial);
    this.ui.achievementsButton.removeEventListener('click', this.onOpenAchievements);
    this.ui.achievementsBack.removeEventListener('click', this.onCloseAchievements);
    this.ui.rewardsButton.removeEventListener('click', this.onOpenRewards);
    this.ui.rewardsBack.removeEventListener('click', this.onCloseRewards);
    this.ui.soundEnabled.removeEventListener('change', this.onSoundEnabledChange);
    this.ui.soundVolume.removeEventListener('input', this.onSoundVolumeChange);
    this.ui.graphicsQuality.removeEventListener('change', this.onGraphicsQualityChange);
    this.ui.pause.removeEventListener('click', this.onPause);
    this.ui.heroSwitch.removeEventListener('click', this.onHeroSwitch);
    window.removeEventListener('resize', this.onResize);
    document.removeEventListener('visibilitychange', this.onVisibility);
    this.projectiles.destroy();
    this.impactParticles.destroy();
    this.hero.destroy();
    this.level.destroy();
    this.renderer.dispose();
    this.mount.replaceChildren();
  }
}
