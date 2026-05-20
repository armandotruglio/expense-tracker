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
    body: {
        color: 'var(--text-2)',
        fontSize: 14,
        lineHeight: 1.5,
        marginBottom: 20,
        whiteSpace: 'pre-line',
    },
    actions: { display: 'flex', gap: 10, justifyContent: 'flex-end' },
    btnGhost: {
        padding: '10px 18px',
        background: 'var(--surface)',
        border: '1px solid var(--line-2)',
        borderRadius: 'var(--radius-md)',
        color: 'var(--text)',
        fontSize: 14,
        fontWeight: 600,
    },
    btnPrimary: {
        padding: '10px 18px',
        background: 'var(--grad-hero)',
        border: 'none',
        borderRadius: 'var(--radius-md)',
        color: 'white',
        fontWeight: 700,
        fontSize: 14,
        boxShadow: 'var(--shadow-coral)',
    },
    btnDanger: {
        padding: '10px 18px',
        background: 'var(--danger)',
        border: 'none',
        borderRadius: 'var(--radius-md)',
        color: 'white',
        fontWeight: 700,
        fontSize: 14,
    },
}
