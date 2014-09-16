fis.config.set('namespace', 'lsdemo');

fis.config.set('pack', {
    'all.js': 'widget/**/*.js'
});

fis.config.get('roadmap.path').unshift({
    reg : /^\/ls\-diff\-plugin\/(plugin\/.*\.php)$/i,
    release: '/$1'
});

fis.config.get('roadmap.path').unshift({
    reg : /^\/data\/ls\-diff\.php$/i,
    release: '/config/ls-diff.php'
});

// npm install -g fis-postpackager-lsdiff-map
fis.config.set('module.postpackager', 'lsdiff-map');