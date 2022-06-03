import { DynamicPool } from 'node-worker-threads-pool';

try{
  const databases = [        
      {    
          "table" : "users",
          "fields" : ["name","email","code"],
          "datas" : [
            ["Admin","admin@gmail.com",1],           
            ["User","user@gmail.com",2]
          ],
          "sqlTable" : `CREATE TABLE users (
              id int NOT NULL AUTO_INCREMENT PRIMARY KEY,
              code varchar(50) NOT NULL UNIQUE,
              name varchar(50) NOT NULL,
              email varchar(50) NOT NULL UNIQUE
          );`
      },
      {    
        "table" : "suppliers",
        "fields" : ["name","code"],
        "datas" : [
          ["Sup1",1],           
          ["Sup2",2]
        ],
        "sqlTable" : `CREATE TABLE suppliers (
            id int NOT NULL AUTO_INCREMENT PRIMARY KEY,
            code varchar(50) NOT NULL UNIQUE,
            name varchar(50) NOT NULL
        );`
    },
    ]

  const dynamicPool = new DynamicPool(4,{
    workerData: 'workerData!',
  });

  let doneTask = 0;

  for (const [index,data] of databases.entries()) {  
    dynamicPool.exec({
      task: async function(data){
        const mysql = this.require('mysql2/promise');

        const connection = await mysql.createConnection({
          host:'localhost', 
          user: 'root', 
          password : 'root',
          database: 'db_backup_transaction'
        });

        await connection.connect();

        console.log("Connect Success");

        // console.log(data);

        await connection.execute(`
          DROP TABLE IF EXISTS ${data.table}
        `);      

        await connection.execute(data.sqlTable);
        
        for(const item of data.datas){
          let fields = data.fields.join(",");
          let values = item.map(item => `'${item}'`).join(",");
      
          await connection.execute(`INSERT INTO ${data.table} (${fields}) VALUES (${values})`)
        }

        await connection.end();
      },
      param : data      
    })
    .then(function(){
      console.log(`Done ${data.table}`);  

      doneTask += 1;

      if(doneTask === databases.length){
        process.exit();      
      }
    });
  }
}catch(err){
  console.log(err);
  process.exit();      
}