import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'

export const Settings = () => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Settings</CardTitle>
      </CardHeader>
      <CardContent className="text-sm text-gray-600">
        Platform settings and configuration options live here.
      </CardContent>
    </Card>
  )
}
