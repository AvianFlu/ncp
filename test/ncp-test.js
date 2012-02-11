var assert = require('assert'),
    path = require('path'),
    rimraf = require('rimraf'),
    vows = require('vows'),
    readDirFiles = require('read-dir-files'),
    ncp = require('../').ncp;

var fixtures = path.join(__dirname, 'fixtures'),
    src = path.join(fixtures, 'src'),
    out = path.join(fixtures, 'out');

vows.describe('ncp').addBatch({
  'When using `ncp`': {
    'and copying files from one directory to another': {
      topic: function () {
        var cb = this.callback;
        rimraf(out, function () {
          ncp(src, out, cb);
        });
      },
      'it should copy files': {
        topic: function () {
          var cb = this.callback;

          readDirFiles(src, 'utf8', function (srcErr, srcFiles) {
            readDirFiles(out, 'utf8', function (outErr, outFiles) {
              cb(outErr, srcFiles, outFiles);
            });
          });
        },
        'and destination files should match source files': function (err, srcFiles, outFiles) {
          assert.isNull(err);
          assert.deepEqual(srcFiles, outFiles);
        }
      }
    }
  }
}).addBatch({
  'When using ncp': {
    'and copying files using filter': {
      topic: function() {
        var cb = this.callback;
        var filter = function(name) {
          return name.substr(name.length - 1) != 'a'
        }
        rimraf(out, function () {
          ncp(src, out, {filter: filter}, cb);
        });
      },
      'it should copy files': {
        topic: function () {
          var cb = this.callback;

          readDirFiles(src, 'utf8', function (srcErr, srcFiles) {
            function filter(files) {
              for (var fileName in files) {
                var curFile = files[fileName];
                if (curFile instanceof Object)
                  return filter(curFile);
                if (fileName.substr(fileName.length - 1) == 'a')
                  delete files[fileName];
              }
            }
            filter(srcFiles);
            readDirFiles(out, 'utf8', function (outErr, outFiles) {
              cb(outErr, srcFiles, outFiles);
            });
          });
        },
        'and destination files should match source files that pass filter': function (err, srcFiles, outFiles) {
          assert.isNull(err);
          assert.deepEqual(srcFiles, outFiles);
        }
      }
    }
  }
}).export(module);

