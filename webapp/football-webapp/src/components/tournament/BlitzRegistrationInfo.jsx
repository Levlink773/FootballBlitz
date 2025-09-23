// BlitzRegistrationInfo.jsx
import React from "react";
import styled from "styled-components";

const InfoWrapper = styled.div`
    height: 10%;
    width: 80%;
    position: relative;
    top: 470px;
    left: 40px;
  margin-top: 12px;
  padding: 10px 14px;
  border-radius: 10px;
  background: rgba(0, 0, 0, 0.1);
  color: white;
  font-family: 'Inter', sans-serif;
  font-size: 10px;
  line-height: 1.5;
  text-shadow: 1px 1px 3px rgba(0,0,0,0.6);
`;

const Title = styled.div`
  font-weight: 700;
  margin-bottom: 0px;
  font-size: 10px;
`;

const List = styled.ul`
  margin: 0;
  padding-left: 18px;
`;

const ListItem = styled.li`
  margin-bottom: 4px;
  font-weight: 500;
`;

export default function BlitzRegistrationInfo() {
    return (
        <InfoWrapper>
            <Title>📜 Реєстрація відкривається:</Title>
            <List>
                <ListItem>за 30 хв до VIP-турніру</ListItem>
                <ListItem>за 20 хв до звичайних турнірів</ListItem>
            </List>
        </InfoWrapper>
    );
}
