import { createRoot } from 'react-dom/client';
import { App, NoWebGL } from './App';
import './styles.css';
import { useExperience } from './stores/useExperience';

// ?debug expõe o estado no console (útil para testes automatizados)
if (import.meta.env.DEV || location.search.includes('debug')) Object.assign(window, { __store: useExperience });

const hasWebGL2 = (() => {
  try {
    return !!document.createElement('canvas').getContext('webgl2');
  } catch {
    return false;
  }
})();

// As texturas procedurais desenham texto em canvas: espera as fontes para não sair com a fonte padrão.
const fontsReady = Promise.race([
  Promise.all(['700 64px Oswald', '500 32px "Cormorant Garamond"', '500 16px "JetBrains Mono"'].map((f) => document.fonts.load(f))),
  new Promise((r) => setTimeout(r, 2500)),
]);

fontsReady.finally(() => {
  createRoot(document.getElementById('root')!).render(hasWebGL2 ? <App /> : <NoWebGL />);
});
