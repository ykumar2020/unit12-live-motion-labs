import { createApp } from 'vue';
import App from './App.vue';
import './shared/style.css';
import { installShell } from './shared/lab.js';
installShell(2);
createApp(App).mount('#app');
