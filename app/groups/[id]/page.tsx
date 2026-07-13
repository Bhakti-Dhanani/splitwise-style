import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import { headers } from 'next/headers'
import { getGroupById, getGroupMembers } from '@/app/actions/groups'
import { getExpensesByGroup, getGroupSettlements } from '@/app/actions/expenses'
import GroupHeader from '@/components/group-header'
import GroupMembers from '@/components/group-members'
import ExpensesList from '@/components/expenses-list'
import SettlementsList from '@/components/settlements-list'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

export default async function GroupDetailPage({
  params,
}: {
  params: { id: string }
}) {
  const session = await auth.api.getSession({ headers: await headers() })

  if (!session?.user) {
    redirect('/sign-in')
  }

  const group = await getGroupById(params.id)
  const members = await getGroupMembers(params.id)
  const expenses = await getExpensesByGroup(params.id)
  const settlements = await getGroupSettlements(params.id)

  return (
    <main className="min-h-screen bg-gradient-to-br from-background via-background to-background">
      {/* Header */}
      <GroupHeader group={group} />

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Tabs defaultValue="expenses" className="space-y-6">
          <TabsList className="grid w-full max-w-md grid-cols-3 bg-card border border-border">
            <TabsTrigger value="expenses">Expenses</TabsTrigger>
            <TabsTrigger value="members">Members</TabsTrigger>
            <TabsTrigger value="settlements">Settlements</TabsTrigger>
          </TabsList>

          <TabsContent value="expenses" className="space-y-6">
            <ExpensesList groupId={params.id} expenses={expenses} members={members} />
          </TabsContent>

          <TabsContent value="members" className="space-y-6">
            <GroupMembers groupId={params.id} members={members} />
          </TabsContent>

          <TabsContent value="settlements" className="space-y-6">
            <SettlementsList
              settlements={settlements}
              groupId={params.id}
            />
          </TabsContent>
        </Tabs>
      </div>
    </main>
  )
}
