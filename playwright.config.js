import {defineConfig} from '@playwright/test';
export default defineConfig({testDir:'./tests/browser',timeout:45000,fullyParallel:true,workers:4,retries:0,reporter:[['list'],['json',{outputFile:'evidence/browser-results.json'}]],use:{viewport:{width:1440,height:1000},trace:'retain-on-failure'}});
