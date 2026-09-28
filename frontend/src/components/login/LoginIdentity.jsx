import { DitheredLogo } from "../ui/dithered-logo";
import WarpText from "../reactbits/WarpText";
import "./LoginIdentity.css";

export default function LoginIdentity() {
  return (
    <div className="login-identity">
      <DitheredLogo
        imageSrc="/images/campusdesk-mark.svg"
        className="login-identity-mark"
        gridSize={120}
        scale={0.9}
        dotScale={0.75}
        invert
        cornerRadius={0.2}
        gamma={1}
        blur={3.75}
        diffusionStrength={1}
        particleColor="#a9b1fb"
      />
      <WarpText
        text="Campusdesk"
        color="#f8f5ff"
        warpStrength={0.08}
        warpScale={1.7}
        speed={0.55}
        pointerInfluence={0.42}
        pointerStrength={0.38}
        refraction={0.018}
        ripple
        fontSize="clamp(28px, 3.8vw, 60px)"
        fontWeight={700}
        fontFamily='"Space Grotesk", sans-serif'
        letterSpacing="-0.03em"
        lineHeight={1.1}
        className="login-identity-name"
      />
    </div>
  );
}
