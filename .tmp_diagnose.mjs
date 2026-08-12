import('framer-motion').then(m => {
  console.log('resolved framer-motion esm');
  console.log(Object.keys(m).slice(0,20));
}).catch(err => {
  console.error('esm import error');
  console.error(err);
});
