import '@builder.io/qwik/qwikloader.js';
import { render } from '@builder.io/qwik';
import { App } from './App.jsx';
import './shared/style.css';
import { installShell } from './shared/lab.js';
installShell(8);
render(document.getElementById('app'), <App />);
