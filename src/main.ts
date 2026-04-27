import './styles.css';
import { generateName } from './lib/nameGenerator';
import { HISTORY_LIMIT } from './constants';
import type { GeneratedName } from './types';

type FlipState = 'idle' | 'spinning' | 'revealing';

type AppState = {
  name: GeneratedName | null;
  loading: boolean;
  history: GeneratedName[];
  flipState: FlipState;
  error: string | null;
  waitMessage: string | null;
  canRetry: boolean;
};

const state: AppState = {
  name: null,
  loading: false,
  history: [],
  flipState: 'idle',
  error: null,
  waitMessage: null,
  canRetry: false,
};

let controller: AbortController | null = null;
let waitTimers: ReturnType<typeof setTimeout>[] = [];
let pendingRetry = false;

function clearWaitTimers() {
  waitTimers.forEach(clearTimeout);
  waitTimers = [];
}

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
  if (state.loading && !state.canRetry) {
    button.disabled = true;
    button.textContent = state.waitMessage ?? 'Generating…';
  } else if (state.loading && state.canRetry) {
    button.disabled = false;
    button.textContent = state.waitMessage ?? 'Perhaps just try again.';
  } else {
    button.disabled = false;
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
  if (state.loading) return;
  state.loading = true;
  state.error = null;
  state.waitMessage = null;
  state.canRetry = false;
  state.flipState = 'spinning';
  render();

  controller = new AbortController();

  const waitSchedule: [number, string][] = [
    [4_000, 'A moment more, if you please…'],
    [10_000, 'Still consulting the registry…'],
    [18_000, 'The scribes are being rather thorough…'],
    [25_000, 'Patience, dear visitor — a name will come…'],
    [30_000, 'Perhaps just try again.'],
  ];

  for (const [delay, msg] of waitSchedule) {
    waitTimers.push(setTimeout(() => {
      state.waitMessage = msg;
      if (delay >= 30_000) state.canRetry = true;
      render();
    }, delay));
  }

  try {
    const generated = await generateName(controller.signal);

    state.flipState = 'revealing';
    render();
    await nextPaint();

    state.name = generated;
    state.history = [generated, ...state.history].slice(0, HISTORY_LIMIT);
    render();
    await nextPaint();

    state.flipState = 'idle';
  } catch (err) {
    if (err instanceof DOMException && err.name === 'AbortError') {
      state.flipState = 'idle';
    } else {
      console.error(err);
      state.flipState = 'idle';
      state.error = 'The name generation machine has temporarily jammed. Try again.';
    }
  } finally {
    clearWaitTimers();
    state.loading = false;
    state.waitMessage = null;
    state.canRetry = false;
    controller = null;
    render();
    if (pendingRetry) {
      pendingRetry = false;
      void requestName();
    }
  }
}

button.addEventListener('click', () => {
  if (state.canRetry) {
    pendingRetry = true;
    controller?.abort();
  } else {
    void requestName();
  }
});

render();
void requestName();
