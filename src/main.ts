import './styles.css';
import { generateName } from './lib/nameGenerator';
import { HISTORY_LIMIT } from './constants';
import type { GeneratedName, LlmConfig } from './types';

type FlipState = 'idle' | 'spinning' | 'revealing';

type AppState = {
  name: GeneratedName | null;
  loading: boolean;
  history: GeneratedName[];
  flipState: FlipState;
  error: string | null;
};

const config: LlmConfig = {
  baseUrl: import.meta.env.VITE_LLM_BASE_URL ?? 'http://localhost:11434',
  model: import.meta.env.VITE_LLM_MODEL ?? 'llama3.1',
};

const state: AppState = {
  name: null,
  loading: false,
  history: [],
  flipState: 'idle',
  error: null,
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
  button.disabled = state.loading;
  button.textContent = state.loading ? 'Generating…' : '✦ Generate Name ✦';
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
  state.flipState = 'spinning';
  render();

  try {
    const generated = await generateName(config);

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

button.addEventListener('click', () => {
  void requestName();
});

render();
void requestName();
