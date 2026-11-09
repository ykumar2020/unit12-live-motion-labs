import { render } from 'preact';
import { App } from './App.jsx';
import './shared/style.css';
import { installShell } from './shared/lab.js';
installShell(4);
render(<App />, document.getElementById('app'));
