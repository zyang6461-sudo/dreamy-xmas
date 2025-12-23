export function GreetingOverlay() {
  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        pointerEvents: 'none',
        zIndex: 20, // �?Canvas �?
      }}
    >
      <div
        style={{
          position: 'absolute',
          right: 92,
          top: '44%',
          transform: 'translateY(-50%)',
          textAlign: 'left',
        }}
      >
        {/* Merry Christmas（可删，如果你只要中文） */}
        <div
          style={{
            display: 'inline-block',
            padding: '10px 16px',
            borderRadius: 14,
            background: 'rgba(255,255,255,0.12)',
            backdropFilter: 'blur(6px)',
            WebkitBackdropFilter: 'blur(6px)',
            marginBottom: 10,
          }}
        >
          <div
            style={{
              fontSize: 34,
              lineHeight: 1,
              fontFamily:
                '"Brush Script MT","Segoe Script","Snell Roundhand","Pacifico",cursive',
              color: '#e9ffff',
              textShadow:
                '0 0 10px rgba(125,249,255,0.55), 0 0 22px rgba(255,122,217,0.30)',
              letterSpacing: 0.3,
              whiteSpace: 'nowrap',
            }}
          >
            Merry Christmas
          </div>
        </div>

        {/* �?你要的中文文�?*/}
        <div
          style={{
            color: '#ffffff',
            fontSize: 22,
            lineHeight: 1.55,
            fontWeight: 650,
            letterSpacing: 0.8,
            textShadow: '0 0 10px rgba(255,255,255,0.20)',
            userSelect: 'none',
          }}
        >
             <div>to syy:</div>
          <div>圣诞是冬的来�?/div>
          <div>而你是我的惊�?/div>
          <div>from yzy</div>
        </div>
      </div>
    </div>
  );
}

