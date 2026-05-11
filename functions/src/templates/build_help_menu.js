export function buildHelpMenu() {
  return {
    type: "bubble",
    size: "mega",
    header: {
      type: "box",
      layout: "vertical",
      backgroundColor: "#3d3d3d",
      paddingAll: "md",
      contents: [
        {
          type: "text",
          color: "#dcbc90",
          weight: "bold",
          size: "lg",
          text: "💡 指令列表：",
          offsetTop: "sm",
        },
      ],
      background: {
        type: "linearGradient",
        angle: "45deg",
        startColor: "#1e1e1c",
        endColor: "#252525",
        centerColor: "#3d3d3d",
      },
      margin: "none",
      height: "50px",
    },
    body: {
      type: "box",
      layout: "vertical",
      spacing: "sm",
      paddingAll: "md",
      contents: [
        {
          type: "box",
          layout: "baseline",
          spacing: "sm",
          margin: "md",
          contents: [
            {
              type: "text",
              text: "/help  - 顯示說明",
              size: "sm",
              color: "#555451",
              flex: 2,
              weight: "bold",
              margin: "lg",
            },
          ],
        },
        {
          type: "box",
          layout: "baseline",
          spacing: "sm",
          margin: "md",
          contents: [
            {
              type: "text",
              text: "/find  <關鍵字> - 搜尋檔案名稱",
              size: "sm",
              color: "#555451",
              flex: 2,
              weight: "bold",
              margin: "lg",
            },
          ],
        },
        {
          type: "box",
          layout: "baseline",
          spacing: "sm",
          margin: "md",
          contents: [
            {
              type: "text",
              text: "/match <關鍵字> -智能匹配相似內容",
              size: "sm",
              color: "#555451",
              flex: 2,
              weight: "bold",
              margin: "lg",
            },
          ],
        },
      ],
      background: {
        type: "linearGradient",
        angle: "135deg",
        endColor: "#aa802c",
        centerColor: "#fbdc9b",
        startColor: "#ebb156",
      },
      offsetTop: "none",
      offsetBottom: "none",
      offsetStart: "none",
      paddingTop: "md",
      paddingBottom: "xl",
    },
    styles: {
      header: {
        backgroundColor: "#3d3d3d",
      },
    },
  };
}
