use actix::{Actor, StreamHandler};
use actix_web::{get, web, App, HttpRequest, HttpResponse, HttpServer, Responder, Result};
use actix_web_actors::ws;

struct GameWS;

impl Actor for GameWS {
    type Context = ws::WebsocketContext<Self>;
}

impl StreamHandler<Result<ws::Message, ws::ProtocolError>> for GameWS {
    fn handle(&mut self, msg: Result<ws::Message, ws::ProtocolError>, ctx: &mut Self::Context) {
        // process websocket messages
        println!("WS: {msg:?}");
        match msg {
            Ok(ws::Message::Ping(msg)) => ctx.pong(&msg),
            _ => (),
        }
    }
}

#[get("/game_engine")]
async fn game_engine_ws(req: HttpRequest, stream: web::Payload) -> impl Responder {
    let resp = ws::start(GameWS {}, &req, stream);
    println!("{:?}", resp);
    resp
}

#[get("/")]
async fn index() -> impl Responder {
    HttpResponse::Ok().body("Hello World Learn Workspace")
}

#[actix_web::main]
async fn main() -> std::io::Result<()> {
    HttpServer::new(|| App::new().service(index).service(game_engine_ws))
        .bind(("0.0.0.0", 8080))?
        .run()
        .await
}
