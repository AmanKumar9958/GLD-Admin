import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'

export const Dashboard = () => {
  return (
    <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
      <Card>
        <CardHeader>
          <CardTitle>Welcome to GLD Admin</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-600">
            Manage courses, students, and settings from this dashboard. Use the sidebar to navigate.
          </p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Quick Tips</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-gray-600">
          <p>• Create and publish courses from the Courses section.</p>
          <p>• Add modules and upload videos inside each course.</p>
          <p>• Keep student data up to date from the Students tab.</p>
        </CardContent>
      </Card>
    </div>
  )
}
