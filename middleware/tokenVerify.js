
import { verifyJWT } from "../utils/jwt.utils.js"
export async function checkAuthMiddleware(req, res, next) {
  const token = req.header("Authorization");
  if(!token || !token.startsWith("Bearer ")) {
    return res.status(401).json({ error: true })
  }
  const realToken = token.split("Bearer ")[1]
  const tokenDetails = await verifyJWT(realToken);
  const payload = !tokenDetails ? null : tokenDetails.payload
  req.user = payload;
  return !payload ? res.status(401).json({ error: true }) : next();
}

