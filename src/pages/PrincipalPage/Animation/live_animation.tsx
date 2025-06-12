import "./live_animation.css";

function live_animation() {
  return (
    <>
      <div className="conjunto-circle">
        <div className="outer-outer-circle">
          <div className="arc-hole-top-outer-outer"> </div>
          <div className="arc-hole-bottom-outer-outer"> </div>
        </div>
        <div className="outer-circle"> </div>
        <div className="inner-circle"></div>
      </div>
    </>
  );
}

export default live_animation;
