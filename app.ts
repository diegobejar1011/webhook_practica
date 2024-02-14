import express, { Request, Response, NextFunction } from "express";
import * as crypto from "crypto";
import cors from "cors";

const app = express();

app.use(cors());
app.use(express.json());

app.get("/", (req: Request, res: Response) => {
  try {
    res.status(200).json({ success: true });
  } catch (error: any) {
    res.status(500).json(error.message);
  }
});

app.listen(3000, () => {
  console.log("Server is running at 3000");
});

//middleware

const verify_signature_middleware = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    verify_signature(req);
    next();
  } catch (error) {
    res.status(400).json({
      success: false,
      message: "No autorizado",
    });
  }
};

const verify_signature = (req: Request) => {
  try {
    const signature = crypto
      .createHmac("sha256", "1234")
      .update(JSON.stringify(req.body))
      .digest("hex");
    const trusted = Buffer.from(`sha256=${signature}`, "ascii");
    const untrusted = Buffer.from(
      req.header("x-hub-signature-256") ?? "",
      "ascii"
    );
    return crypto.timingSafeEqual(trusted, untrusted);
  } catch (error: any) {
    throw new Error(error);
  }
};

//notificación de discord

app.post("/github-event", (req: Request, res: Response) => {
  try {
    const { body } = req;
    const { action, sender, repository } = body;
    const event = req.headers["x-github-event"];
    console.log(
      `Received event ${event} from ${sender.login} for repository ${repository.name}`
    );
    let message = "";
    switch (event) {
      case "issues":
        const { issue } = req.body;
        message = `${sender.login} ${action} issue ${issue.title} on ${repository.full_name}`;
        break;
      case "push":
        message = `${sender.login} pushes on ${repository.full_name}`;
        break;
      case "star":
        message = `Starred by ${sender.login}`;
        break;
      default:
        message = "Event not handled";
    }

    notifyDiscord(message);

    res.status(200).json({
      success: true,
    });
  } catch (error: any) {
    res.status(500).send(error.message);
  }
});

const webhookURL =
  "https://discord.com/api/webhooks/1207294858436411454/g1C1hBnrofo9nwzcWyGT_iB-CCG1_NedMDCCGfOOgfkqqGaowwxKp0IZpJ4cr5LGk5fE";
const notifyDiscord = async (message: string) => {
  const body = {
    content: message,
  };

  const response = await fetch(webhookURL, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    console.log("error al enviar el mensaje");
    return false;
  }

  return true;
};
