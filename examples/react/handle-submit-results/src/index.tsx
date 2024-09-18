import type { FieldApi } from '@tanstack/react-form'
import { useForm } from '@tanstack/react-form'
import * as React from 'react'
import { createRoot } from 'react-dom/client'

function FieldInfo({ field }: { field: FieldApi<any, any, any, any> }) {
  return (
    <>
      {field.state.meta.isTouched && field.state.meta.errors.length ? (
        <em>{field.state.meta.errors.join(',')}</em>
      ) : null}
      {field.state.meta.isValidating ? 'Validating...' : null}
    </>
  )
}

type Person = {
  id?: number
  firstName: string
  lastName: string
}

async function postToServer({ firstName, lastName }: Person): Promise<Person> {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      if (firstName == 'Heinz') {
        reject('Server response: This name is already taken.')
      } else {
        resolve({
          id: 23,
          firstName,
          lastName,
        })
      }
    })
  })
}

export default function App() {
  const form = useForm<Person>({
    defaultValues: {
      firstName: '',
      lastName: '',
    },
    onSubmit: async ({ value }): Promise<void | Person> => {
      try {
        return await postToServer(value)
      } catch (err: any) {
        form.setFieldMeta("firstName", (meta) => {console.log("updater!"); return {...meta, errorMap: {...meta.errorMap, onServer: err}}})
        return
      }
    },
  })

  return (
    <div>
      <h1>Handle Submit Results</h1>
      <form
        onSubmit={(e) => {
          e.preventDefault()
          e.stopPropagation()
          form.handleSubmit()
        }}
      >
        <div>
          {/* A type-safe field component*/}
          <form.Field
            name="firstName"
            validators={{
              onChange: ({ value }) =>
                !value
                  ? 'A first name is required'
                  : value.length < 3
                    ? 'First name must be at least 3 characters'
                    : undefined,
              onChangeAsyncDebounceMs: 500,
              onChangeAsync: async ({ value }) => {
                await new Promise((resolve) => setTimeout(resolve, 1000))
                return (
                  value.includes('error') && 'No "error" allowed in first name'
                )
              },
            }}
            children={(field) => {
              // Avoid hasty abstractions. Render props are great!
              return (
                <>
                  <label htmlFor={field.name}>First Name:</label>
                  <input
                    id={field.name}
                    name={field.name}
                    value={field.state.value}
                    onBlur={field.handleBlur}
                    onChange={(e) => field.handleChange(e.target.value)}
                  />
                  <FieldInfo field={field} />
                </>
              )
            }}
          />
        </div>
        <div>
          <form.Field
            name="lastName"
            children={(field) => (
              <>
                <label htmlFor={field.name}>Last Name:</label>
                <input
                  id={field.name}
                  name={field.name}
                  value={field.state.value}
                  onBlur={field.handleBlur}
                  onChange={(e) => field.handleChange(e.target.value)}
                />
                <FieldInfo field={field} />
              </>
            )}
          />
        </div>
        <form.Subscribe
          selector={(state) => [state.canSubmit, state.isSubmitting]}
          children={([canSubmit, isSubmitting]) => (
            <>
              <button
                type="submit"
                disabled={!canSubmit}
                onClick={async () => {
                  const result = await form.handleSubmit()
                  if (result) {
                    window.alert(
                      'Successfully created item. Navigating to list view ...',
                    )
                  }
                }}
              >
                {isSubmitting ? '...' : 'Create and close'}
              </button>
              <br />
              <button
                type="submit"
                disabled={!canSubmit}
                onClick={async () => {
                  const result = await form.handleSubmit()
                  if (result) {
                    window.alert(
                      `Successfully created item. Navigating now to item with id: ${result?.id}`,
                    )
                  }
                }}
              >
                {isSubmitting ? '...' : 'Create and continue editing'}
              </button>
              <br />
              <button type="reset" onClick={() => form.reset()}>
                Reset
              </button>
            </>
          )}
        />
      </form>
    </div>
  )
}

const rootElement = document.getElementById('root')!

createRoot(rootElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
