const gulp = require('gulp');
const metadata = require('./package');
const tasks = require('gulp-tasks');

tasks.init({
    metadata: metadata,
    libs: [
        'node_modules/base-component/dist/base-component.js',
        'node_modules/manifold/dist/manifold.bundle.js'
    ]
});