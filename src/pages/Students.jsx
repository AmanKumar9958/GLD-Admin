import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'

export const Students = () => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Students</CardTitle>
      </CardHeader>
      <CardContent className="text-sm text-gray-600">
        Student management views can be added here.
      </CardContent>
    </Card>
  )
}
