type ErrorAlertProps = {
    message: string
}

export function ErrorAlert({ message }: ErrorAlertProps) {
    return (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            <span className="font-medium">Ошибка:</span> {message}
        </div>
    )
}