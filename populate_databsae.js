import { DynamicPool } from 'node-worker-threads-pool';

try{
  const databases = [        
      {    
          "table" : "users",
          "fields" : ["name","email","code"],
          "range" : {
            "value" : 10,
            "values" : ["User-","user@gmail.com-","Code-"]
          },                 
          "sqlTable" : `CREATE TABLE users (
              id int NOT NULL AUTO_INCREMENT PRIMARY KEY,
              code varchar(50) NOT NULL UNIQUE,
              name varchar(50) NOT NULL,
              email varchar(50) NOT NULL UNIQUE,
              created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
              updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
              deleted_at TIMESTAMP NULL
          );`
      },

      {    
        "table" : "suppliers",
        "fields" : ["name","code"],
        "range" : {
          "value" : 10,
          "values" : ["Sup-","Code-"]
        },                
        "sqlTable" : `CREATE TABLE suppliers (
            id int NOT NULL AUTO_INCREMENT PRIMARY KEY,
            code varchar(50) NOT NULL UNIQUE,
            name varchar(50) NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            deleted_at TIMESTAMP NULL
        );`
      },

      {    
        "table" : "warehouses",
        "fields" : ["name","code"],
        "range" : {
          "value" : 10,
          "values" : ["Wr-","Code-"]
        },                
        "sqlTable" : `CREATE TABLE warehouses (
            id int NOT NULL AUTO_INCREMENT PRIMARY KEY,
            code varchar(50) NOT NULL UNIQUE,
            name varchar(50) NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            deleted_at TIMESTAMP NULL
        );`
      },

      {    
        "table" : "customers",
        "fields" : ["name","code","type"],
        "range" : {
          "value" : 10,
          "values" : ["Cr-","Code-","Type-"]
        },          
        "sqlTable" : `CREATE TABLE customers (
            id int NOT NULL AUTO_INCREMENT PRIMARY KEY,
            code varchar(50) NOT NULL UNIQUE,
            type varchar(50) NOT NULL,
            name varchar(50) NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            deleted_at TIMESTAMP NULL
        );`
      },

      {    
        "table" : "products",
        "fields" : ["name","code"],
        "range" : {
          "value" : 10,
          "values" : ["Pt-","Code-"]
        },          
        "sqlTable" : `CREATE TABLE products (
            id int NOT NULL AUTO_INCREMENT PRIMARY KEY,
            code varchar(50) NOT NULL UNIQUE,
            name varchar(50) NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            deleted_at TIMESTAMP NULL
        );`
      },

      {
        "table" : "purchaseings",
        "fields" : ["code","supplier_id","user_id","total"],    
        "datas" : [
          ["PG-1",1,1,10000],                 
          ["PG-2",2,2,20000]
        ],
        "sqlTable" : `CREATE TABLE purchaseings (
            id int NOT NULL AUTO_INCREMENT PRIMARY KEY,
            code varchar(50) NOT NULL UNIQUE,
            supplier_id int DEFAULT NULL,
            user_id int DEFAULT NULL,
            total DECIMAL(20,2) DEFAULT 0.00,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            deleted_at TIMESTAMP NULL
        );`,
        "childs" : {
          "table" : "purchaseing_details",
          "fields" : ["product_id","quantity","price","amount","purchaseing_id"],    
          "datas" : [
            [1,1,5000,5000,1],                 
            [2,1,5000,5000,1],                 
            [1,2,10000,10000,2],
            [2,2,10000,10000,2]
          ],
          "sqlTable" : `CREATE TABLE purchaseing_details (
              id int NOT NULL AUTO_INCREMENT PRIMARY KEY,
              purchaseing_id int DEFAULT NULL,
              product_id int DEFAULT NULL,              
              quantity DECIMAL(20,2) DEFAULT 0.00,
              price DECIMAL(20,2) DEFAULT 0.00,
              amount DECIMAL(20,2) DEFAULT 0.00
          );`,
        }
      },

      {
        "table" : "sellings",
        "fields" : ["code","customer_id","user_id","total","warehouse_id"],    
        "datas" : [
          ["SG-1",1,1,10000,1],                 
          ["SG-2",2,2,20000,1]
        ],
        "sqlTable" : `CREATE TABLE sellings (
            id int NOT NULL AUTO_INCREMENT PRIMARY KEY,
            code varchar(50) NOT NULL UNIQUE,
            customer_id int DEFAULT NULL,
            user_id int DEFAULT NULL,
            warehouse_id int DEFAULT NULL,
            total DECIMAL(20,2) DEFAULT 0.00,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            deleted_at TIMESTAMP NULL
        );`,
        "childs" : {
          "table" : "selling_details",
          "fields" : ["product_id","quantity","price","amount","selling_id"],    
          "datas" : [
            [1,1,5000,5000,1],                 
            [2,1,5000,5000,1],                 
            [1,2,10000,10000,2],
            [2,2,10000,10000,2]
          ],
          "sqlTable" : `CREATE TABLE selling_details (
              id int NOT NULL AUTO_INCREMENT PRIMARY KEY,
              selling_id int DEFAULT NULL,
              product_id int DEFAULT NULL,              
              quantity DECIMAL(20,2) DEFAULT 0.00,
              price DECIMAL(20,2) DEFAULT 0.00,
              amount DECIMAL(20,2) DEFAULT 0.00
          );`,
        }
      }    
    ]

  const dynamicPool = new DynamicPool(4,{
    workerData: 'workerData!',
  });

  let doneTask = 0;

  for (const [index,data] of databases.entries()) {  
    dynamicPool.exec({
      task: async (data) => {
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
       
        if(data.range){
          for(const item of Array.from(Array(data.range.value).keys())){
            let fields = data.fields.join(",");
            let values = data.range.values.map(itemMap => `"${itemMap}${item}"`).join(",");
      
            await connection.execute(`INSERT INTO ${data.table} (${fields}) VALUES (${values})`)    
          }
        }else{
          for(const item of data.datas){
            let fields = data.fields.join(",");
            let values = item.map(itemMap => `'${itemMap}'`).join(",");
      
            await connection.execute(`INSERT INTO ${data.table} (${fields}) VALUES (${values})`)
          }

          if(data.childs){
            await connection.execute(`
              DROP TABLE IF EXISTS ${data.childs.table}
            `);      
  
            await connection.execute(data.childs.sqlTable);
            
            for(const item of data.childs.datas){
              let fields = data.childs.fields.join(",");
              let values = item.map(itemMap => `'${itemMap}'`).join(",");
      
              await connection.execute(`INSERT INTO ${data.childs.table} (${fields}) VALUES (${values})`)
            }  
          }
        }       

        await connection.end();
      },
      param : data      
    })
    .then(() => {
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