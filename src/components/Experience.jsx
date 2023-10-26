import { Environment, OrbitControls } from "@react-three/drei";
import { Map } from "./Map";
import { useEffect, useState } from "react";
import {
  Joystick,
  insertCoin,
  isHost,
  myPlayer,
  onPlayerJoin,
  useMultiplayerState,
} from "playroomkit";
import { CharacterController } from "./CharacterController";
import { Bullet } from "./Bullet";
import { BulletHit } from "./BulletHit";

export const Experience = () => {
  const [players, setPlayers] = useState([]);
  const [bullets, setBullets] = useState([]);
  const [networkBullets, setNetworkBullets] = useMultiplayerState(
    "bullets",
    []
  );

  const [hits, setHits] = useState([]);

  const [networkHits, setNetworkHits] = useMultiplayerState("hits", []);

  const [isJumping, setIsJumping] = useState(false);

  const onFire = (bullet) => {
    setBullets((bullets) => [...bullets, bullet]);
  };

  const onHit = (bulletId, position) => {
    setBullets((bullets) => bullets.filter((bullet) => bullet.id !== bulletId));
    setHits((hits) => [...hits, { id: bulletId, position }]);
  };

  const onHitEnded = (hitId) => {
    setHits((hits) => hits.filter((h) => h.id !== hitId));
  };

  useEffect(() => {
    setNetworkBullets(bullets);
  }, [bullets]);

  useEffect(() => {
    setNetworkHits(hits);
  }, [hits]);

  const start = async () => {
    // Show Playroom UI, let it handle players joining etc and wait for host to tap "Launch"
    await insertCoin();

    //Create a joystick controller for each joining player
    onPlayerJoin((state) => {
      // Joystick will only create UI for current player (myplayer)
      // For otheres , it will onlt sync their state

      const joystick = new Joystick(state, {
        type: "angular",
        buttons: [
          { id: "fire", label: "Fire" },
          { id: "jump", label: "Jump" },
        ],
      });
      const newPlayer = { state, joystick };
      state.setState("health", 100);
      state.setState("deaths", 0);
      state.setState("kills", 0);
      setPlayers((players) => [...players, newPlayer]);
      state.onQuit(() => {
        setPlayers((players) => players.filter((p) => p.state.id !== state.id));
      });
    });
  };

  useEffect(() => {
    start();
  }, []);

  const onKilled = (_victim, killer) => {
    const killerState = players.find((p) => p.state.id === killer).state;
    killerState.setState("kills", killerState.state.kills + 1);
  };

  return (
    <>
      <directionalLight
        position={[25, 18, -25]}
        intensity={0.3}
        castShadow
        shadow-camera-near={0}
        shadow-camera-far={80}
        shadow-camera-left={-30}
        shadow-camera-right={30}
        shadow-camera-top={25}
        shadow-camera-bottom={-25}
        shadow-mapSize-width={4096}
        shadow-mapSize-height={4096}
        shadow-bias={-0.0001}
      />
      <Map />
      {players.map(({ state, joystick }, idx) => (
        <CharacterController
          key={state.id}
          state={state}
          userPlayer={state.id === myPlayer()?.id}
          joystick={joystick}
          onFire={onFire}
          onKilled={onKilled}
          isJumping={isJumping}
          setIsJumping={setIsJumping}
        />
      ))}
      {(isHost() ? bullets : networkBullets).map((bullet) => (
        <Bullet
          key={bullet.id}
          {...bullet}
          onHit={(position) => onHit(bullet.id, position)}
        />
      ))}
      {(isHost() ? hits : networkHits).map((hit) => (
        <BulletHit key={hit.id} {...hit} onEnded={() => onHitEnded(hit.id)} />
      ))}
      <Environment preset="sunset" />
    </>
  );
};
