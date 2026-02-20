'use client'

import { useState } from 'react'
import { createUser, deleteUser, updateUser } from '@/app/lib/user-actions'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Trash2, UserPlus, Pencil } from 'lucide-react'

interface User {
  id: string
  email: string
  name: string | null
  firstName: string | null
  lastName: string | null
  role: 'ADMIN' | 'USER'
  permissions: string[]
  mustChangePassword: boolean
  createdAt: Date
  updatedAt: Date
}

export function UserManagement({ users }: { users: User[] }) {
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [editingUser, setEditingUser] = useState<User | null>(null)

  // Helper to format date
  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(date))
  }

  const handleEditClick = (user: User) => {
    setEditingUser(user)
    setIsEditOpen(true)
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {/* Create User Form */}
      <div className="md:col-span-1">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserPlus className="h-5 w-5" /> Ajouter un utilisateur
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form
              action={async (formData) => {
                await createUser(formData)
              }}
              className="space-y-4"
            >
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-2">
                  <Label htmlFor="firstName">Prénom</Label>
                  <Input id="firstName" name="firstName" required placeholder="Jean" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName">Nom</Label>
                  <Input id="lastName" name="lastName" required placeholder="Dupont" />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  required
                  placeholder="user@kontfeel.fr"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Mot de passe</Label>
                <Input id="password" name="password" type="password" required />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="role">Rôle</Label>
                <select 
                  id="role" 
                  name="role" 
                  className="flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm ring-offset-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-950 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  defaultValue="USER"
                >
                  <option value="USER">Utilisateur</option>
                  <option value="ADMIN">Administrateur</option>
                </select>
              </div>

              <Button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-700">
                Créer
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>

      {/* Users List */}
      <div className="md:col-span-2">
        <Card>
          <CardHeader>
            <CardTitle>Utilisateurs ({users.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nom</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Dernière maj</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell className="font-medium">
                      {user.firstName || user.lastName
                        ? `${user.firstName || ''} ${user.lastName || ''}`
                        : user.name}
                    </TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell className="text-slate-500 text-xs">
                      {formatDate(user.updatedAt)}
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-1">
                        {user.mustChangePassword ? (
                          <span className="inline-flex w-fit items-center rounded-full bg-yellow-100 px-2.5 py-0.5 text-xs font-medium text-yellow-800">
                            Requis
                          </span>
                        ) : (
                          <span className="inline-flex w-fit items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800">
                            Actif
                          </span>
                        )}
                        <span className={`inline-flex w-fit items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                          user.role === 'ADMIN' 
                            ? 'bg-purple-100 text-purple-800' 
                            : 'bg-blue-100 text-blue-800'
                        }`}>
                          {user.role}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          size="icon"
                          variant="ghost"
                          className="text-blue-500 hover:text-blue-700 hover:bg-blue-50"
                          onClick={() => handleEditClick(user)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>

                        <form
                          action={async () => {
                            await deleteUser(user.id)
                          }}
                        >
                          <Button
                            size="icon"
                            variant="ghost"
                            className="text-red-500 hover:text-red-700 hover:bg-red-50"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </form>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      {/* Edit Dialog */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Modifier l&apos;utilisateur</DialogTitle>
            <DialogDescription>
              Modifiez les informations de l&apos;utilisateur ici. Cliquez sur sauvegarder une fois
              terminé.
            </DialogDescription>
          </DialogHeader>
          {editingUser && (
            <form
              action={async (formData) => {
                await updateUser(formData)
                setIsEditOpen(false)
              }}
              className="space-y-4"
            >
              <input type="hidden" name="id" value={editingUser.id} />
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-firstName">Prénom</Label>
                  <Input
                    id="edit-firstName"
                    name="firstName"
                    defaultValue={editingUser.firstName || ''}
                    placeholder="Prénom"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-lastName">Nom</Label>
                  <Input
                    id="edit-lastName"
                    name="lastName"
                    defaultValue={editingUser.lastName || ''}
                    placeholder="Nom"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-email">Email</Label>
                <Input
                  id="edit-email"
                  name="email"
                  type="email"
                  defaultValue={editingUser.email}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-password">Nouveau mot de passe (optionnel)</Label>
                <Input
                  id="edit-password"
                  name="password"
                  type="password"
                  placeholder="Laisser vide pour ne pas changer"
                />
              </div>

              <div className="grid gap-4 pt-4 border-t">
                <div className="space-y-2">
                  <Label htmlFor="edit-role">Rôle</Label>
                  <select 
                    id="edit-role" 
                    name="role" 
                    className="flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm ring-offset-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-950 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    defaultValue={editingUser.role}
                  >
                    <option value="USER">Utilisateur</option>
                    <option value="ADMIN">Administrateur</option>
                  </select>
                </div>

                <div className="space-y-3">
                  <Label>Permissions</Label>
                  <div className="grid grid-cols-2 gap-3">
                    {['MANAGE_USERS', 'MANAGE_PRODUCTS', 'MANAGE_PLATES', 'MANAGE_SETTINGS'].map((perm) => (
                      <div key={perm} className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          id={`perm-${perm}`}
                          name="permissions"
                          value={perm}
                          className="h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-600"
                          defaultChecked={editingUser.permissions.includes(perm)}
                        />
                        <Label htmlFor={`perm-${perm}`} className="text-sm font-normal cursor-pointer">
                          {perm.replace('MANAGE_', '').toLowerCase()}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button type="submit" className="bg-emerald-600 hover:bg-emerald-700">
                  Sauvegarder
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
