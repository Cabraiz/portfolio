import React, { useEffect, useRef, useState } from "react";
import AudioPlayer from "react-h5-audio-player";
import "react-h5-audio-player/lib/styles.css";
import { Col, Row, Image, Button, Modal } from "react-bootstrap";
import update from "react-addons-update";
import { isMobile } from "react-device-detect";
import ScratchCard from "react-scratchcard-v2";

import icognita from "../../images/Surprise/Icognita.png";
import icognitaBlock from "../../images/Surprise/IcognitaBlock.png";
import icognitaDone from "../../images/Surprise/icognitaDone.png";
import circle from "../../images/Surprise/circle.png";

import Done_1 from "../../images/Surprise/Done_1.png";
import Done_2 from "../../images/Surprise/Done_2.png";
import Done_3 from "../../images/Surprise/Done_3.png";
import Done_4 from "../../images/Surprise/Done_4.png";
import Done_5 from "../../images/Surprise/Done_5.png";
import Done_6 from "../../images/Surprise/Done_6.png";

import { auth, db } from "../../Firebase/Firebase";
import { getDoc, setDoc, doc } from "firebase/firestore";
import "animate.css";
import { onAuthStateChanged } from "firebase/auth";

import { Done, Default, Block } from "./Triplice/Triplice";

const backgroundSong = require("../../song/Surprise/backgroundSong.ogg");

const vh = 85;
const vw = 46;
const percRasp = 1;
let load = false;

function Surprise() {
  const [data, setData] = useState(25);

  const startHorarios = [15, 16, 18, 18, 20, 23];
  const [finalizados, setFinalizados] = useState<any>([]);

  //const [bloqueados, setBloqueado] = useState(
  //  Array(5).fill(false)
  //);

  const getRealTime = async () => {
    const response = await fetch(
      "http://worldtimeapi.org/api/timezone/America/Fortaleza"
    );
    const temp = await response.json();
    setData(new Date(temp.datetime).getHours());
  };

  const fetchPost = async () => {
    const temp = getStringValue(auth.currentUser?.uid);
    const docRef = doc(db, temp, "bloqueados");
    const docSnap = await getDoc(docRef);
    await getRealTime();
    if (docSnap.exists()) {
      let tempBooleanos = [];
      console.log(docSnap.data());
      for (const element of Object.values(docSnap.data())) {
        tempBooleanos.push(element);
      }
      setFinalizados([returnFetchPost(Done_1, tempBooleanos[0])]);
    } else {
      // doc.data() will be undefined in this case
      console.log("No such document!");
    }
  };

  const returnFetchPost = (a: string, b: boolean) => {
    console.log(b);
    if (b) {
      return (
        <Done>
          <Image className="porBaixo" src={Done_1}></Image>
        </Done>
      );
    }
    return (
      <Block>
        <Image className="porBaixo" src={Done_1}></Image>
      </Block>
    );
  };

  useEffect(() => {
    onAuthStateChanged(auth, (user) => {
      if (user && !load) {
        load = true;
        fetchPost();
      }
    });

    const setTodo = async () => {
      const temp = getStringValue(auth.currentUser?.uid);
      if (temp !== undefined) {
        await setDoc(doc(db, temp, "bloqueados"), {
          0: false,
          1: false,
          2: false,
          3: false,
          4: false,
          5: false,
        });
      }
    };
  }, []);

  function getStringValue(value: any): string {
    return String(value);
  }

  const ref = useRef<ScratchCard>(null);

  const icognitaStatus = (b: number) => {
    if (finalizados[b]) {
      return icognitaDone;
    }
    if (startHorarios[b] < data) {
      return icognita;
    }
    return icognitaBlock;
  };

  const convertVhToPx = (vh: number) => {
    const oneVhInPx = window.innerHeight / 100;
    return oneVhInPx * vh;
  };

  const convertVwToPx = (vw: number, a: number) => {
    const oneVhInPx = window.innerWidth / 100;
    let temp = oneVhInPx * vw;
    if (!isMobile) {
      temp = temp / 3.6;
    }
    if (temp < 140) {
      temp = 140;
    }
    return Math.ceil(temp);
  };

  //MODAL
  const [show, setShow] = useState([false, false]);

  const handleStatus = (a: number, b: boolean) => {
    console.log(finalizados);
    setShow(
      update(show, {
        [a]: {
          $set: b,
        },
      })
    );
  };

  const stringCustomStyle = {
    borderRightWidth: "inherit",
    borderStyle: "solid",
    borderColor: "white",
    borderWidth: "5px 5px 5px 0",
    borderRadius: "5px",
  };
  const cardCustomStyle = {
    image: circle,
    width: 15,
    height: 15,
  };

  const getImage = (a: number) => {
    if (startHorarios[a] < data) {
      return icognita;
    }
    return icognitaBlock;
  };

  return (
    <>
      <Row className="m-0 p-0">
        <Col
          className="p-0 ms-0 me-0 mb-0 text-nowrap"
          style={{ marginTop: "5vh" }}
        >
          <div className="inline" style={stringCustomStyle}>
            {finalizados[0]}
          </div>

          <div className="inline" style={stringCustomStyle}>
            <ScratchCard
              width={convertVwToPx(vw, 1)}
              height={convertVhToPx(vh)}
              image={getImage(1)}
              finishPercent={percRasp}
              onComplete={() => handleStatus(1, true)}
              customBrush={cardCustomStyle}
            >
              <Image className="porBaixo" src={Done_2}></Image>
            </ScratchCard>
          </div>

          <div className="inline" style={stringCustomStyle}>
            <ScratchCard
              width={convertVwToPx(vw, 2)}
              height={convertVhToPx(vh)}
              image={getImage(2)}
              finishPercent={percRasp}
              onComplete={() => console.log("complete")}
              customBrush={cardCustomStyle}
            >
              <Image className="porBaixo" src={Done_3}></Image>
            </ScratchCard>
          </div>

          <div className="inline" style={stringCustomStyle}>
            <ScratchCard
              width={convertVwToPx(vw, 3)}
              height={convertVhToPx(vh)}
              image={getImage(3)}
              finishPercent={percRasp}
              onComplete={() => console.log("complete")}
              customBrush={cardCustomStyle}
            >
              <Image className="porBaixo" src={Done_4}></Image>
            </ScratchCard>
          </div>

          <div className="inline" style={stringCustomStyle}>
            <ScratchCard
              width={convertVwToPx(vw, 4)}
              height={convertVhToPx(vh)}
              image={getImage(4)}
              finishPercent={percRasp}
              onComplete={() => console.log("complete")}
              customBrush={cardCustomStyle}
            >
              <Image className="porBaixo" src={Done_5}></Image>
            </ScratchCard>
          </div>

          <div className="inline" style={stringCustomStyle}>
            <ScratchCard
              width={convertVwToPx(vw, 5)}
              height={convertVhToPx(vh)}
              image={getImage(5)}
              finishPercent={percRasp}
              onComplete={() => console.log("complete")}
              customBrush={cardCustomStyle}
            >
              <Image className="porBaixo" src={Done_6}></Image>
            </ScratchCard>
          </div>
        </Col>
      </Row>
      <Modal
        className="animate__bounceIn"
        show={show[0]}
        onHide={() => handleStatus(0, false)}
      >
        <Modal.Header closeButton>
          <Modal.Title>Modal heading</Modal.Title>
        </Modal.Header>
        <Modal.Body>Woohoo, you're reading this text in a modal!</Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => handleStatus(0, false)}>
            Close
          </Button>
          <Button variant="primary" onClick={() => handleStatus(0, false)}>
            Save Changes
          </Button>
        </Modal.Footer>
      </Modal>
      <Modal show={show[1]} onHide={() => handleStatus(1, false)}>
        <Modal.Header closeButton>
          Aperte&nbsp;<strong>(▷)</strong>&nbsp;Para Ver Seu Prêmio
        </Modal.Header>
        <Modal.Body>
          <AudioPlayer
            autoPlay
            src={backgroundSong}
            onPlay={(e) => console.log("onPlay")}
            loop={true}
          />
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => handleStatus(0, false)}>
            Close
          </Button>
          <Button variant="primary" onClick={() => handleStatus(0, false)}>
            Save Changes
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  );
}

export default Surprise;
