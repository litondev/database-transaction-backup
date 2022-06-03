import { StaticPool,DynamicPool } from 'node-worker-threads-pool';

const staticPool = new StaticPool({
  size: 4,
  task: (n) => n + 1
});
    
let result = await staticPool.exec(1);

console.log('result from thread pool:', result); 
    
const dynamicPool = new DynamicPool(4);
      
result = await dynamicPool
  .exec({
    task: (n) => n + 1,
    param: 1
  });

console.log(result); 
  
process.exit();      
