// import { DynamicPool } from 'node-worker-threads-pool';
import mongoose from "mongoose";
import mysql from 'mysql2/promise';

try{
    const options = {
        "limit" : 100
    }

    const datas = [
        {
            "table" : "purchaseings",
            "relasionals" : [
                {
                    "many" : false,
                    "table" : "suppliers",
                    "filed" : "supplier_id",
                    "filed_relasional" : "id",
                    "column" : "supplier",
                    "keys" : ["id","name"]
                },
                {
                    "many" : false,
                    "table" : "users",
                    "filed" : "user_id",
                    "filed_relasional" : "id",
                    "column" : "user",
                    "keys" : ["id", "name"]
                },
                {
                    "many" : true,        
                    "table" :"purchaseing_details",
                    "filed" : "id",
                    "filed_relasional" : "purchaseing_id",
                    "column" : "purchaseing_details",
                    "keys" : [
                        "purchaseing_id",
                        "product_id",
                        "quantity",
                        "price",
                        "amount"
                    ],
                    "relasionals" : [
                        {
                            "many" : false,
                            "table" : "products",
                            "filed" : "product_id",
                            "filed_relasional" : "id",
                            "column" : "product",
                            "keys" : ["id","name"]
                        },
                    ]
                }
            ],
            "mongodb_model" : {
                "id" : {
                    type: Number,
                    default : null 
                },
                "supplier_id" : {
                    type: Number,
                    default : null 
                },
                "user_id" : {
                    type : Number,
                    default : null
                },

                "supplier" : {                    
                    type : {
                        "id" : {
                            type:  Number,
                            default : null,
                        },
                        "name" : {
                            type : String,
                            default : null 
                        }
                    },
                    default : null
                },

                "user" : {
                    type : {
                        "id" : {
                            type:  Number,
                            default : null,
                        },
                        "name" : {
                            type : String,
                            default : null 
                        }
                    },
                    default : null
                },

                "purchaseing_details" : {
                    type : [
                            // TYPE DEFAULT ARRAY
                            {
                                "id" : {
                                    type : Number,
                                    defualt : null 
                                },
                                "purchaseing_id" : {
                                    type : Number,
                                    defualt : null                             
                                },
                                "product_id" : {
                                    type : Number,
                                    default : null 
                                },
                                "product" : {
                                    type : {
                                        "id" : {
                                            type : Number,
                                            default : null
                                        },
                                        "name" : {
                                            type : String,
                                            defualt : null  
                                        } 
                                    },
                                    default : null
                                },                        
                                "quantity" : {
                                    type : mongoose.Decimal128,
                                    default : 0.00
                                },
                                "price" : {
                                    type : mongoose.Decimal128,
                                    default : 0.00
                                },
                                "amount" : {
                                    type : mongoose.Decimal128,
                                    default : 0.00
                                }
                            }
                    ],
                    defualt : []
                },

                "code" : {
                    type : String,
                    default : null
                },
                "total" : {
                    type : mongoose.Decimal128,
                    default : 0.00
                },
                "created_at" : {
                    type : Date,
                    default : null 
                },
                "updated_at" : {
                    type : Date,
                    default : null 
                },
                "deleted_at" : {
                    type : Date,
                    default : null
                },
            }
        }
    ];

    const connection = await mysql.createConnection({
        host:'localhost', 
        user: 'root', 
        password : 'root',
        database: 'db_backup_transaction'
      });

    await connection.connect();

    console.log("Connect Mysql Success");

    // MAYBE YOU NEED CREATE DATABASE FIRST
    await mongoose.connect(`mongodb://localhost:27017/test`,{         
        // authSource : "admin",        
        // user : process.env.DB_USERNAME,
        // pass : process.env.DB_PASSWORD,        
        // useNewUrlParser: true,
        // useUnifiedTopology: true
    });

    console.log("Success Mongodb Conn");

    for (const [index,data] of datas.entries()) {  
        // CHECKING IF THERE IS DATA EXISTS
        let [row,filed] = await connection.execute(`
            SELECT id FROM ${data.table} ORDER BY ID ASC LIMIT 1
        `);

        if(row.length === 0){
            console.log("Continue");
            continue;
        }

        // DO QUERY TO MAIN TABLE
        let [rows,fileds] = await connection.execute(`
           SELECT * FROM ${data.table} ORDER BY ID ASC LIMIT ${options.limit}
        `)        

        for(const [indexRow,dataRow] of rows.entries()){
            let newData = {
                ...dataRow
            };

            // QUERY TO RELASIONAL
            for(const [indexRelasional,dataRealasional] of data.relasionals.entries()){
                let isMany = dataRealasional.many === true;        

                let selectFields = dataRealasional.keys.join(",");
                
                let query = `
                    SELECT ${selectFields} FROM ${dataRealasional.table} 
                    WHERE ${dataRealasional.filed_relasional}=${dataRow[dataRealasional.filed]} ${!isMany ? 'limit 1' : ''}
                `;        

                let [rowRelasionals,fieldRelasional] = await connection.execute(query);

                if(dataRealasional.relasionals){
                    for(const [indexRowRelasional,dataRowRealasional] of rowRelasionals.entries()){
                        for(const [indexChildRelasional,dataChildRelasional] of dataRealasional.relasionals.entries()){
                            // JUST FOR ONE NOT MANY

                            let selectChildFields = dataChildRelasional.keys.join(",");

                            let [rowChildRelasionals,fieldChildRelasional] = await connection.execute(`
                                SELECT ${selectChildFields} FROM ${dataChildRelasional.table} 
                                WHERE ${dataChildRelasional.filed_relasional}=${dataRowRealasional[dataChildRelasional.filed]} limit 1
                            `);
                    
                            rowRelasionals[indexRowRelasional][dataChildRelasional.column] = rowChildRelasionals.length 
                                ? rowChildRelasionals[0] 
                                : null;      
                        }
                    }
                }                

                newData[dataRealasional.column] = !isMany 
                        ? (rowRelasionals.length 
                            ? rowRelasionals[0] 
                            : null ) 
                        : rowRelasionals;                              
            }

            // INSERT IN MONGODB 

            // console.log(newData);

            
            let dataModel = mongoose.models[data.table] || mongoose.model(data.table,data.mongodb_model);

            let dataPast = await dataModel.findOne({ 'id': newData.id });

            console.log(dataPast);

            let insertData = new dataModel(newData);

            let resultInsert = await insertData.save();

            if(resultInsert){
                console.log('DONE INSERT');
            }else{
                break;
                process.exit();      
            }

            // DELETE DATA
            let [result] = await connection.execute(`
                DELETE FROM ${data.table} WHERE id=${dataRow.id}
            `)            
            
            if(result.affectedRows){
                // console.log("Delete Success");
            }else{
                break;
                process.exit();      
                // console.log("Delete Failed");
            }
        }
    }

    process.exit();      
}catch(err){
    console.log("Failed : " + err.message);
    process.exit();      
}