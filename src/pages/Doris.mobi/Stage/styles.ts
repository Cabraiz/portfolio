import styled from "styled-components";

export const Container = styled.div`
  position: fixed;
  bottom: 15px;
  right: 15px;
  width: 370px;
  height: 644px;
  overflow: hidden;
  border-radius: 15px;

  @media (max-width: 414px) and (max-height: 896px) {
    width: 100%;
    height: 100%;
    right: 0;
    bottom: 0;
    border-radius: 0;
  }
`;

export const Image = styled.img`
  object-fit: cover;
  width: 100%;
  height: 100%;
  pointer-events: none;
`;

export const PriceTag = styled.span`
  background: #00a2ff;
  color: #fff;
  font-size: 14px;
  font-weight: 600;
  border-radius: 5px;
  position: absolute;
  top: 50%;
  left: 15px;
  padding: 5px 10px;
  transform: translateY(-50%);
  pointer-events: none;
  z-index: 2;
`;