import React from "react";

interface CareerHistoryTabProps {
  header: React.ReactNode;
  content: React.ReactNode;
  dialog?: React.ReactNode;
  floatingAction?: React.ReactNode;
}

const CareerHistoryTab: React.FC<CareerHistoryTabProps> = ({
  header,
  content,
  dialog,
  floatingAction,
}) => {
  return (
    <>
      {header}
      {content}
      {dialog}
      {floatingAction}
    </>
  );
};

export default CareerHistoryTab;
