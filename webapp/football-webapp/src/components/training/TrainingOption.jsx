import React from 'react';
import PropTypes from 'prop-types';

export default function TrainingOption({ bg, chance, duration, cost, actionImg, actionIcon }) {
    return (
        <div
            style={{
                width: 371,
                height: 57,
                position: "relative",
                borderRadius: 20,
                overflow: "hidden",
            }}
        >
            {/* Фон */}
            <img
                src={bg}
                alt="background"
                style={{
                    width: "100%",
                    height: "100%",
                    position: "absolute",
                    top: 0,
                    left: 0,
                    borderRadius: 20,
                }}
            />

            {/* Вертикальные белые линии */}
            <div
                style={{
                    position: "absolute",
                    left: 156,
                    top: 10,
                    width: 37.57,
                    borderTop: "2px solid white",
                    transform: "rotate(90deg)",
                    transformOrigin: "top left",
                }}
            />
            <div
                style={{
                    position: "absolute",
                    left: 221,
                    top: 10,
                    width: 37.57,
                    borderTop: "2px solid white",
                    transform: "rotate(90deg)",
                    transformOrigin: "top left",
                }}
            />

            {/* Шанс повышения + процент */}
            <div
                style={{
                    position: "absolute",
                    top: 0,
                    bottom: 0,
                    left: 20,
                    width: 130,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    fontFamily: "Inter",
                    fontWeight: 700,
                    textShadow: "2px 2px 4px rgba(0,0,0,0.5)",
                }}
            >
  <span
      style={{
          color: "white",
          fontSize: 12,
      }}
  >
    Шанс підвищення
  </span>
                <span
                    style={{
                        color: "#F6FF4D",
                        fontSize: 13,
                        marginLeft: 6,
                    }}
                >
    {chance}
  </span>
            </div>


            {/* Длительность */}
            <div
                style={{
                    position: "absolute",
                    top: 0,
                    bottom: 0,
                    left: 166,
                    width: 45,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "white",
                    fontSize: 13,
                    fontFamily: "Inter",
                    fontWeight: 700,
                    textShadow: "2px 2px 4px rgba(0,0,0,0.5)",
                }}
            >
                {duration}
            </div>

            {/* Кнопка действия */}
            <div
                style={{
                    position: "absolute",
                    right: 8,
                    top: 6,
                    width: 124,
                    height: 43,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    borderRadius: 20,
                    boxShadow: "5px 4px 4px rgba(0,0,0,0.5)",
                    backgroundImage: `url(${actionImg})`,
                    backgroundSize: "cover",
                }}
            >
        <span
            style={{
                color: "black",
                fontSize: 12,
                fontFamily: "Inter",
                fontWeight: 700,
                textShadow: "2px 2px 4px rgba(0,0,0,0.5)",
                marginRight: 4,
            }}
        >
          Розпочати {cost}
        </span>
                <img
                    src={actionIcon}
                    alt="action icon"
                    style={{ width: 10, height: 14 }}
                />
            </div>
        </div>
    );
}

TrainingOption.propTypes = {
    bg: PropTypes.string.isRequired,
    chance: PropTypes.string.isRequired,
    duration: PropTypes.string.isRequired,
    cost: PropTypes.number.isRequired,
    actionImg: PropTypes.string.isRequired,
    actionIcon: PropTypes.string.isRequired,
};
