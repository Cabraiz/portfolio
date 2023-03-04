import React, { useEffect, useRef, useState } from "react";
import AudioPlayer from "react-h5-audio-player";
import "react-h5-audio-player/lib/styles.css";
import { Col, Row, Image, Button, Modal } from "react-bootstrap";
import update from "react-addons-update";

import Done_1 from "../../images/Surprise/Done_1.png";
import Done_2 from "../../images/Surprise/Done_2.png";
import Done_3 from "../../images/Surprise/Done_3.png";
import Done_4 from "../../images/Surprise/Done_4.png";
import Done_5 from "../../images/Surprise/Done_5.png";
import Done_6 from "../../images/Surprise/Done_6.png";

import { auth, db } from "../../Firebase/Firebase";
import { getDoc, setDoc, doc } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import "animate.css";

import { Done, Default, Block } from "./Triplice/Triplice";

const backgroundSong = require("../../song/Surprise/backgroundSong.ogg");

let load = false;

function Surprise() {
  const startHorarios = [15, 16, 18, 18, 20, 23];
  const [finalizados, setFinalizados] = useState<any>([]);

  const [cssCombine] = useState<any>([]);

  const getRealTime = async () => {
    const response = await fetch(
      "http://worldtimeapi.org/api/timezone/America/Fortaleza"
    );
    const temp = await response.json();
    return new Date(temp.datetime).getHours();
  };

  const fetchPost = async () => {
    const temp = getStringValue(auth.currentUser?.uid);
    const docRef = doc(db, temp, "bloqueados");
    const docSnap = await getDoc(docRef);
    const hora = await getRealTime();
    if (docSnap.exists()) {
      let tempBooleanos = [];
      for (const element of Object.values(docSnap.data())) {
        tempBooleanos.push(element);
      }
      setFinalizados([
        returnFetchPost(0, tempBooleanos[0], hora),
        returnFetchPost(1, tempBooleanos[1], hora),
        returnFetchPost(2, tempBooleanos[2], hora),
        returnFetchPost(3, tempBooleanos[3], hora),
        returnFetchPost(4, tempBooleanos[4], hora),
        returnFetchPost(5, tempBooleanos[5], hora),
      ]);
    } else {
      // doc.data() will be undefined in this case
      console.log("No such document!");
    }
  };

  const imagensAcervo = [Done_1, Done_2, Done_3, Done_4, Done_5, Done_6];
  const returnFetchPost = (a: number, b: boolean, data: number) => {
    if (b) {
      cssCombine.push({});
      return (
        <Done onComplete={() => handleStatus(0, true)}>
          <Image className="porBaixo" src={imagensAcervo[a]}></Image>
        </Done>
      );
    }
    if (startHorarios[a] > data) {
      cssCombine.push({
        pointerEvents: "none" as React.CSSProperties["pointerEvents"],
      });
      return (
        <Block>
          <Image className="porBaixo" src={imagensAcervo[a]}></Image>
        </Block>
      );
    }
    cssCombine.push({});
    return (
      <Default>
        <Image className="porBaixo" src={imagensAcervo[a]}></Image>
      </Default>
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

  //MODAL
  const [show, setShow] = useState([false, false]);

  const handleStatus = (a: number, b: boolean) => {
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

  return (
    <>
      <Row className="m-0 p-0">
        <Col
          className="p-0 ms-0 me-0 mb-0 text-nowrap"
          style={{ marginTop: "5vh" }}
        >
          <div
            className="inline"
            style={Object.assign({}, stringCustomStyle, cssCombine[0])}
          >
            {finalizados[0]}
          </div>

          <div
            className="inline"
            style={Object.assign({}, stringCustomStyle, cssCombine[1])}
          >
            {finalizados[1]}
          </div>

          <div
            className="inline"
            style={Object.assign({}, stringCustomStyle, cssCombine[2])}
          >
            {finalizados[2]}
          </div>

          <div
            className="inline"
            style={Object.assign({}, stringCustomStyle, cssCombine[3])}
          >
            {finalizados[3]}
          </div>

          <div
            className="inline"
            style={Object.assign({}, stringCustomStyle, cssCombine[4])}
          >
            {finalizados[4]}
          </div>

          <div
            className="inline"
            style={Object.assign({}, stringCustomStyle, cssCombine[5])}
          >
            {finalizados[5]}
          </div>
        </Col>
      </Row>

      <Modal
        className="animate__bounceIn"
        show={show[0]}
        onHide={() => handleStatus(0, false)}
      >
        <Modal.Header closeButton>
          <Image className="modalImage" src={imagensAcervo[0]}></Image>
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
