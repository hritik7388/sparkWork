import Config from "config";
import Routes from "./routes";
import Server from "./common/server";

const dbUrl = `mongodb://${Config.get("databaseHostLocal")}:${Config.get("databasePort")}/${Config.get("databaseName")}`;
// const dbUrl=`mongodb+srv://${Config.get("dbUserName")}:${Config.get("dbPass")}@${Config.get("databaseHost")}/${Config.get("databaseName")}?tls=true&authSource=admin&replicaSet=db-mongodbpawsomeandhovr`;  // for live
console.log("dUrl===>>", dbUrl);

const server = new Server()
  .router(Routes)
  .configureSwagger(Config.get("swaggerDefinition"))
  .handleError()
  .configureDb(dbUrl)
  .then((_server) => _server.listen(Config.get("port")));

export default server;


