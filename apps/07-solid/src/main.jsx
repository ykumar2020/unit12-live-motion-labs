import { render } from 'solid-js/web';
import App from './App.jsx';
import './shared/style.css';
import { installShell } from './shared/lab.js';
installShell(7);
render(() => <App />, document.getElementById('app'));
