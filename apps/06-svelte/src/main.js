import { mount } from 'svelte';
import App from './App.svelte';
import './shared/style.css';
import { installShell } from './shared/lab.js';
installShell(6);
mount(App, { target: document.getElementById('app') });
