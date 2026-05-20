import Modal from './Modal'

export default function ConfirmDialog({
    open,
    title = 'Conferma',
    message,
    confirmLabel = 'Conferma',
    cancelLabel = 'Annulla',
    danger = false,
    onConfirm,
    onCancel,
}) {
    return (
        <Modal open={open} onClose={onCancel} title={title} size="sm">
            <div style={S.body}>{message}</div>
            <div style={S.actions}>
                <button
                    type="button"
                    onClick={onCancel}
                    style={S.btnGhost}
                    className="ix-btn-ghost"
                >
                    {cancelLabel}
                </button>
                <button
                    type="button"
                    onClick={onConfirm}
                    style={danger ? S.btnDanger : S.btnPrimary}
                    className="ix-btn-primary"
                    autoFocus
                >
                    {confirmLabel}
                </button>
            </div>
        </Modal>
    )
}

const S = {
    body: { color: 'var(--text)', fontSize: 14, lineHeight: 1.5, marginBottom: 20, whiteSpace: 'pre-line' },
    actions: { display: 'flex', gap: 10, justifyContent: 'flex-end' },
    btnGhost: {
        padding: '10px 18px',
        background: 'transparent',
        border: '1px solid var(--border-strong)',
        borderRadius: 'var(--radius-md)',
        color: 'var(--text)',
        fontSize: 14,
    },
    btnPrimary: {
        padding: '10px 18px',
        background: 'var(--grad-accent)',
        border: 'none',
        borderRadius: 'var(--radius-md)',
        color: 'white',
        fontWeight: 600,
        fontSize: 14,
    },
    btnDanger: {
        padding: '10px 18px',
        background: 'linear-gradient(135deg, #ef4444, #ff6b6b)',
        border: 'none',
        borderRadius: 'var(--radius-md)',
        color: 'white',
        fontWeight: 600,
        fontSize: 14,
    },
}
