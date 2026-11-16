type TLabelProps = {
  text: string
  control: string
  center?: boolean
  className?: string
  withCampoOpcional?: boolean
  observacaoText?: string
  tamanhoFonte?: string
  altura?: string
  isRequired?: boolean
  withDiv?: boolean
  requiredOffset?: number
}

export const Label = ({
  text,
  control,
  center,
  className,
  withCampoOpcional,
  observacaoText,
  tamanhoFonte = '14',
  altura = '17',
  isRequired,
  withDiv,
  requiredOffset = 0,
}: TLabelProps) => {
  const styles = { fontSize: `${tamanhoFonte}px`, minHeight: `${altura}px` };

  return (
    <div
      className={center ? 'text-center' : ''}
      style={styles}
    >
      {isRequired && (
        <span
          style={{
            marginLeft: `${requiredOffset}px`,
            color: 'var(--vermelho)',
            marginRight: '4px',
          }}
        >
          *
        </span>
      )}
      {withDiv ? (
        <>
          <div id={text} className={className}>
            {text}
            {observacaoText ? <span> {` ${observacaoText}`}</span> : ''}
          </div>
          {withCampoOpcional ? (
            <span id={text} className="campoOpcional">
              (opcional)
            </span>
          ) : null}
        </>
      ) : (
        <>
          <label htmlFor={control} id={text} className={className}>
            {text}
            {observacaoText ? <span> {` ${observacaoText}`}</span> : ''}
          </label>
          {withCampoOpcional ? (
            <label htmlFor={control} id={text} className="campoOpcional">
              (opcional)
            </label>
          ) : null}
        </>
      )}
    </div>
  );
};
