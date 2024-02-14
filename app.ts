import express, { Request, Response, NextFunction} from "express";
import * as crypto from "crypto";

const app = express();
app.use(express.json());

app.get('/', (req: Request, res: Response) =>{
    res.status(200).json({ success: true});
});

app.listen(3000, ()=>{
    console.log('Server is running at 3000');
});


//middleware

const verify_signature_middleware = (req: Request, res:Response, next: NextFunction) => {
    if(!req) {
        res.status(401).json({
            success: false,
            message: "Sin autorizacion"
        })
    }
    next();
}

app.post("/github-event", verify_signature_middleware, (req: Request, res: Response) => {
    const { body } = req;
    const { action, sender, repository } = body;
    const event = req.headers['x-github-event'];
    console.log(`Received event ${event} from ${sender.login} for repository ${repository.name}`);
    let message = "";
    switch (event) {
        case "issues":
            message = `Action: ${action}`;
            break;
        case "push": 
            message = (`Commits: ${body.commits.length}`);
            break;
        case "star":
            message = (`Starred by ${sender.login}`);
            break;
        default:
            message = ("Event not handled");
    }

    notifyDiscord(message);
    res.status(200).json({
        success: true
    })
});

const webhookURL = "https://discord.com/api/webhooks/1207294858436411454/g1C1hBnrofo9nwzcWyGT_iB-CCG1_NedMDCCGfOOgfkqqGaowwxKp0IZpJ4cr5LGk5fE";
const notifyDiscord = async (message: string) => {

    const body = {
        content: message
    }

    const response = await fetch(webhookURL, {
        method: "POST",
        headers: { "content-type": "application/json"},
        body: JSON.stringify(body)
    })

    if(!response.ok) {
        console.log("error al enviar el mensaje")
        return false;
    }

    return true;
}