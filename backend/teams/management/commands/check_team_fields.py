from django.core.management.base import BaseCommand
from django.db import connection
from teams.models import Team


class Command(BaseCommand):
    help = 'Verifica os campos da tabela Team e seus valores'

    def handle(self, *args, **options):
        self.stdout.write("🔍 VERIFICANDO TABELA TEAM...")
        
        # Verificar campos do modelo
        self.stdout.write("\n📋 CAMPOS DO MODELO:")
        for field in Team._meta.get_fields():
            self.stdout.write(f"   ✅ {field.name}: {field.__class__.__name__}")
        
        # Verificar estrutura da tabela
        self.stdout.write("\n🗄️ ESTRUTURA DA TABELA:")
        with connection.cursor() as cursor:
            cursor.execute("""
                SELECT column_name, data_type, is_nullable, column_default
                FROM information_schema.columns 
                WHERE table_name = 'team'
                ORDER BY ordinal_position;
            """)
            
            for row in cursor.fetchall():
                column_name, data_type, is_nullable, column_default = row
                self.stdout.write(f"   📊 {column_name}: {data_type} (nullable: {is_nullable})")
        
        # Verificar dados
        self.stdout.write("\n📊 DADOS ATUAIS:")
        teams = Team.objects.all()
        self.stdout.write(f"   📈 Total de equipes: {teams.count()}")
        
        for team in teams[:5]:  # Mostrar apenas as primeiras 5
            self.stdout.write(f"   👥 {team.name}: is_ocupied = {team.is_ocupied}")
        
        if teams.count() > 5:
            self.stdout.write(f"   ... e mais {teams.count() - 5} equipes")
        
        self.stdout.write("\n✅ VERIFICAÇÃO CONCLUÍDA!")
