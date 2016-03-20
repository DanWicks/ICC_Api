var pg = require('pg');
var connectionString = "postgres://redline_admin:password@localhost/icc_project";
pg.connect(connectionString, function(err, client, done) {});