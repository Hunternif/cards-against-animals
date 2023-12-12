interface Props {
  pick: number,
}

export function PromptCardPick({ pick }: Props) {
  return <>
      <div className="prompt-pick" style={{
        display: "flex",
        alignItems: "baseline",
        flexDirection: "row",
        marginTop: "auto",
        marginLeft: "auto",
      }}>
        PICK
        <div className="prompt-pick-number" style={{
          textAlign: "center",
          borderRadius: "50%",
          width: "1rem",
          height: "1rem",
          lineHeight: "1rem",
          marginLeft: "0.5em",
          backgroundColor: "#fff",
          color: "#000",
          fontWeight: "bold",
        }}>
          {pick}
        </div>
      </div>
  </>;
}