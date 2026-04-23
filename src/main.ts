import './styles.css';
import { generateNameWithEngine, getOrCreateEngine, checkWebGPU } from './lib/nameGenerator';
import { HISTORY_LIMIT } from './constants';
import type { GeneratedName } from './types';

type FlipState = 'idle' | 'spinning' | 'revealing';

type AppState = {
  name: GeneratedName | null;
  loading: boolean;
  downloading: boolean;
  modelProgress: number;
  modelMsg: string;
  history: GeneratedName[];
  flipState: FlipState;
  error: string | null;
  webgpuAvailable: boolean;
};

const state: AppState = {
  name: null,
  loading: false,
  downloading: false,
  modelProgress: 0,
  modelMsg: '',
  history: [],
  flipState: 'idle',
  error: null,
  webgpuAvailable: true,
};

const card = document.getElementById('card') as HTMLDivElement;
const cardBody = document.getElementById('card-body') as HTMLDivElement;
const button = document.getElementById('generate-button') as HTMLButtonElement;
const historySection = document.getElementById('history-section') as HTMLElement;
const historyList = document.getElementById('history') as HTMLDivElement;

const tplLoading = document.getElementById('tpl-loading') as HTMLTemplateElement;
const tplError = document.getElementById('tpl-error') as HTMLTemplateElement;
const tplName = document.getElementById('tpl-name') as HTMLTemplateElement;
const tplHistoryItem = document.getElementById('tpl-history-item') as HTMLTemplateElement;

function renderCard(): void {
  card.classList.remove('is-idle', 'is-spinning', 'is-revealing');
  card.classList.add(`is-${state.flipState}`);

  cardBody.replaceChildren();

  if (!state.webgpuAvailable) {
    const node = tplError.content.cloneNode(true) as DocumentFragment;
    const message = node.querySelector('.card-error__message') as HTMLParagraphElement;
    message.textContent = 'WebGPU is not available. Please use a WebGPU-enabled browser (Chrome, Edge, or Firefox with WebGPU enabled).';
    cardBody.append(node);
    return;
  }

  if (state.downloading) {
    const node = tplLoading.content.cloneNode(true) as DocumentFragment;
    const spinner = node.querySelector('.spinner') as HTMLElement;
    const msg = document.createElement('p');
    msg.className = 'download-msg';
    msg.textContent = state.modelMsg || `Downloading model... ${state.modelProgress}%`;
    if (spinner) {
      spinner.insertAdjacentElement('afterend', msg);
    } else {
      cardBody.append(msg);
    }
    cardBody.append(node);
    return;
  }

  if (state.loading && !state.name) {
    cardBody.append(tplLoading.content.cloneNode(true));
    return;
  }

  if (state.error) {
    const node = tplError.content.cloneNode(true) as DocumentFragment;
    const message = node.querySelector('.card-error__message') as HTMLParagraphElement;
    message.textContent = state.error;
    cardBody.append(node);
    return;
  }

  if (state.name) {
    const node = tplName.content.cloneNode(true) as DocumentFragment;
    (node.querySelector('.card-name__first') as HTMLElement).textContent = state.name.firstName;
    (node.querySelector('.card-name__last') as HTMLElement).textContent = state.name.lastName;
    (node.querySelector('.card-name__fun-fact') as HTMLElement).textContent = `"${state.name.funFact}"`;
    cardBody.append(node);
  }
}

function renderButton(): void {
  button.disabled = state.loading || state.downloading || !state.webgpuAvailable;
  if (state.downloading) {
    button.textContent = 'Downloading model...';
  } else if (state.loading) {
    button.textContent = 'Generating...';
  } else {
    button.textContent = '✦ Generate Name ✦';
  }
}

function renderHistory(): void {
  const items = state.history.slice(1);
  historySection.hidden = items.length === 0;
  historyList.replaceChildren();
  for (const item of items) {
    const node = tplHistoryItem.content.cloneNode(true) as DocumentFragment;
    (node.querySelector('.history-item__first') as HTMLElement).textContent = item.firstName;
    (node.querySelector('.history-item__last') as HTMLElement).textContent = item.lastName;
    historyList.append(node);
  }
}

function render(): void {
  renderCard();
  renderButton();
  renderHistory();
}

function nextPaint(): Promise<void> {
  return new Promise((resolve) => {
    requestAnimationFrame(() => requestAnimationFrame(() => resolve()));
  });
}

async function requestName(): Promise<void> {
  if (state.loading || state.downloading) return;

  state.loading = true;
  state.error = null;
  state.flipState = 'spinning';
  render();

  try {
    const engine = await getOrCreateEngine((progress, msg) => {
      state.modelProgress = progress;
      state.modelMsg = msg;
      render();
    });

    await nextPaint();

    const generated = await generateNameWithEngine(engine);

    state.flipState = 'revealing';
    render();
    await nextPaint();

    state.name = generated;
    state.history = [generated, ...state.history].slice(0, HISTORY_LIMIT);
    render();
    await nextPaint();

    state.flipState = 'idle';
  } catch (err) {
    console.error(err);
    state.flipState = 'idle';
    state.error = 'The name generation machine has temporarily jammed. Try again.';
  } finally {
    state.loading = false;
    render();
  }
}

async function init(): Promise<void> {
  state.webgpuAvailable = await checkWebGPU();

  if (!state.webgpuAvailable) {
    state.error = 'WebGPU is not available. Please use a WebGPU-enabled browser.';
    render();
    return;
  }

  state.downloading = true;
  render();

  try {
    await getOrCreateEngine((progress, msg) => {
      state.modelProgress = progress;
      state.modelMsg = msg;
      render();
    });
    state.downloading = false;
    render();
    await requestName();
  } catch (err) {
    state.downloading = false;
    state.error = 'Failed to load model. Please refresh and try again.';
    console.error(err);
    render();
  }
}

button.addEventListener('click', () => {
  void requestName();
});

render();
void init();