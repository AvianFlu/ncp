# ncp - Asynchronous recursive file & directory copying

Think `cp -r`, but pure node, and asynchronous.  `ncp` can be used both as a CLI tool and programmatically.

## Command Line usage

Usage is simple: `ncp [source] [dest] [filter] [concurrency limit]`

The 'filter' is a Regular Expression - matched files will be copied.

The 'concurrency limit' is an integer that represents how many pending file system requests `ncp` has at a time.

If there are no errors, `ncp` will output `done.` when complete.  If there are errors, the error messages will be logged to `stdout` and to `./ncp-debug.log`, and the copy operation will attempt to continue.

## Programmatic usage

Programmatic usage of `ncp` is just as simple.  The only argument to the completion callback is a possible error.  

```javascript
var ncp = require('ncp').ncp;

ncp.limit = 16;

ncp.ncp(source, destination, /*regex or function to filter,*/function (err) {
 if (err) {
   return console.error(err);
 }
 console.log('done!');
});
```

Please open an issue if any bugs arise.  As always, I accept (working) pull requests, and refunds are available at `/dev/null`.
