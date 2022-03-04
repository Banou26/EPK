import StackFrame from './stackframe'

export default (function() {
  return {
      backtrace: function StackGenerator$$backtrace(opts) {
          var stack = [];
          var maxStackSize = 10;

          if (typeof opts === 'object' && typeof opts.maxStackSize === 'number') {
              maxStackSize = opts.maxStackSize;
          }

          var curr = arguments.callee;
          while (curr && stack.length < maxStackSize && curr['arguments']) {
              // Allow V8 optimizations
              var args = new Array(curr['arguments'].length);
              for (var i = 0; i < args.length; ++i) {
                  args[i] = curr['arguments'][i];
              }
              if (/function(?:\s+([\w$]+))+\s*\(/.test(curr.toString())) {
                  stack.push(new StackFrame({functionName: RegExp.$1 || undefined, args: args}));
              } else {
                  stack.push(new StackFrame({args: args}));
              }

              try {
                  curr = curr.caller;
              } catch (e) {
                  break;
              }
          }
          return stack;
      }
  };
})()
